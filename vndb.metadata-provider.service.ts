import { Injectable } from "@nestjs/common";
import { DeveloperMetadata } from "src/modules/metadata/developers/developer.metadata.entity";
import { GameMetadata } from "src/modules/metadata/games/game.metadata.entity";
import { MinimalGameMetadataDto } from "src/modules/metadata/games/minimal-game.metadata.dto";
import { GenreMetadata } from "src/modules/metadata/genres/genre.metadata.entity";
import { PublisherMetadata } from "src/modules/metadata/publishers/publisher.metadata.entity";
import { TagMetadata } from "src/modules/metadata/tags/tag.metadata.entity";
import { MetadataProvider } from "src/modules/metadata/providers/abstract.metadata-provider.service";
import { } from "@nestjs/common"
import { VndbFilterResponse } from "./models/vndb-filter-response";
import { VndbVisualNovel } from "./models/vndb-visual-novel";

@Injectable()
export class VndbMetadataProviderService extends MetadataProvider {
  enabled = true;
  readonly slug = "vndb";
  readonly name = "VNDB";
  readonly priority = 20;
  readonly fieldsToInclude = [
    "*",
    "age_ratings.*",
    "cover.*",
    "genres.*",
    "involved_companies.*",
    "involved_companies.company.*",
    "keywords.*",
    "screenshots.*",
    "artworks.*",
    "videos.*",
    "themes.*",
    "websites.*",
  ];

  public override async search(
    query: string,
  ): Promise<MinimalGameMetadataDto[]> {
    
    let url = "https://api.vndb.org/kana/vn";
    const data = {
            "filters": [
                "search",
                "=",
                query
            ],
            "fields": "title, image.url, released, length_minutes, description, devstatus, rating, screenshots.url, developers.name, tags.name, tags.id, extlinks.url"
        };
        let response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const responseData : VndbFilterResponse = await response.json() as VndbFilterResponse;

        if (!response.ok) {
            throw new Error(`Error! status: ${response.status}`);
        }

    const searchResults: VndbVisualNovel[]  = [];

    searchResults.push(...responseData.results);

    const minimalGameMetadata : MinimalGameMetadataDto[] = [];
    for (const result of searchResults) {
      minimalGameMetadata.push(
        await this.mapMinimalGameMetadata(result as VndbVisualNovel),
      );
    }
    return minimalGameMetadata;
  }

  public override async getByProviderDataIdOrFail(
    provider_data_id: string,
  ): Promise<GameMetadata> {
    const data = {
        "filters": [
            "id",
            "=",
            provider_data_id
        ],
        "fields": "title, image.url, released, length_minutes, description, devstatus, rating, screenshots.url, developers.name, tags.name, tags.id, extlinks.url"
    };
    let url = "https://api.vndb.org/kana/vn";
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    const responseData : VndbFilterResponse = await response.json() as VndbFilterResponse;
    return this.mapGameMetadata(responseData.results[0] as VndbVisualNovel);
  }

  private async mapGameMetadata(visualNovel: VndbVisualNovel): Promise<GameMetadata> {
    return {
      age_rating: 18,// Assume all visual novels are 18+ for now
      provider_slug: this.slug,
      provider_data_id: visualNovel.id?.toString(),
      provider_data_url:  "https://vndb.org/" + visualNovel.id?.toString(),
      title: visualNovel.title,
      release_date: isNaN(new Date(visualNovel.released).getTime())
        ? undefined
        : new Date(visualNovel.released),
      description: visualNovel.description,
      rating: visualNovel.rating,
      url_websites: visualNovel.extlinks.map(links => links.url),
      early_access: visualNovel.devstatus === 1,
      url_screenshots: visualNovel.screenshots.map(screenshot => screenshot.url),
      url_trailers: undefined,
      url_gameplays: undefined,
      average_playtime: visualNovel.length_minutes,
      developers: visualNovel.developers.map(developer => 
        ({
            provider_slug: this.slug,
            provider_data_id: developer.id,
            name: developer.name,
          }) as DeveloperMetadata,
        ),
      publishers: [],
      genres: [
          ({
            provider_slug: this.slug,
            provider_data_id: "1",
            name: "Visual Novel",
          }) as GenreMetadata,
        ],
      tags: visualNovel.tags.map(tag => 
            ({
                provider_slug: this.slug,
                provider_data_id: tag.id,
                name: tag.name
            })  as TagMetadata),
      cover: await this.downloadImage(visualNovel.image?.url),
      background: undefined,
    } as GameMetadata;
  }

  private async mapMinimalGameMetadata(
    game: VndbVisualNovel,
  ): Promise<MinimalGameMetadataDto> {
    return {
      provider_slug: this.slug,
      provider_data_id: game.id?.toString(),
      title: game.title,
      description: game.description,
      release_date: new Date(game.released),
      cover_url: game.image.url,
    } as MinimalGameMetadataDto;
  }

  private async downloadImage(url?: string) {
    if (!url) return undefined;
    try {
      return await this.mediaService.downloadByUrl(url);
    } catch (error) {
      this.logger.error(`Failed to download image from ${url}:`, error);
      return undefined;
    }
  }
}