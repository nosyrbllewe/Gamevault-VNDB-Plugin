import { VndbVisualNovel } from "./vndb-visual-novel";

export interface VndbFilterResponse 
{
    results : VndbVisualNovel[];
    more: boolean;
}