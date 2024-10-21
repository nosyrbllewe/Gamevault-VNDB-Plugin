import { Injectable } from "@nestjs/common";
import { isNumberString } from "class-validator";
import { isEmpty, toLower } from "lodash";
import configuration from "../../../../configuration";
import { DeveloperMetadata } from "../../developers/developer.metadata.entity";
import { GameMetadata } from "../../games/game.metadata.entity";
import { MinimalGameMetadataDto } from "../../games/minimal-game.metadata.dto";
import { GenreMetadata } from "../../genres/genre.metadata.entity";
import { PublisherMetadata } from "../../publishers/publisher.metadata.entity";
import { TagMetadata } from "../../tags/tag.metadata.entity";
import { MetadataProvider } from "../abstract.metadata-provider.service";

export interface VndbVisualNovel
{
    released: string;
    image: VndbImage;
    title: string;
    description: string;
    id: string;
    length_minutes: number;
    rating: number;
    screenshots: VndbImage[];
    developers: VndbProducer[];
    tags: VndbTag[];
    devstatus: number;
    extlinks: VndbExternalLink[];
}

export interface VndbTag
{
    id: string;
    name: string;
}

export interface VndbImage
{
    url: string;
}

export interface VndbProducer
{
    id: string;
    name: string;
}

export interface VndbExternalLink
{
    url: string;
    label: string;
}

export interface VndbFilterResponse 
{
    results : VndbVisualNovel[];
    more: boolean;
}

@Injectable()
export class VndbMetadataProviderService extends MetadataProvider {
  enabled = configuration.METADATA.IGDB.ENABLED;
  request_interval_ms = configuration.METADATA.IGDB.REQUEST_INTERVAL_MS;
  readonly slug = "vndb";
  readonly name = "VNDB";
  readonly priority = configuration.METADATA.IGDB.PRIORITY;
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

    const found_games: VndbVisualNovel[]  = [];

    found_games.push(...responseData.results);

    this.logger.debug({
      message: `Found ${found_games.length} games on VNDB`,
      query,
      count: found_games.length,
      games: found_games,
    });

    const minimalGameMetadata : MinimalGameMetadataDto[] = [];
    for (const game of found_games) {
      minimalGameMetadata.push(
        await this.mapMinimalGameMetadata(game as VndbVisualNovel),
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
      provider_data_url: "https://example.com",
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
            provider_slug: "vndb",
            provider_data_id: developer.id,
            name: developer.name,
          }) as DeveloperMetadata,
        ),
      publishers: [],
      genres: [
          ({
            provider_slug: "vndb",
            provider_data_id: 1,
            name: "Visual Novel",
          }) as GenreMetadata,
        ],
      tags: visualNovel.tags.map(tag => 
            ({
                provider_slug: "vndb",
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
      provider_slug: "vndb",
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