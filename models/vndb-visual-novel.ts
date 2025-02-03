import { VndbExternalLink } from "./vndb-external-link";
import { VndbImage } from "./vndb-image";
import { VndbProducer } from "./vndb-producer";
import { VndbTag } from "./vndb-tag";

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
