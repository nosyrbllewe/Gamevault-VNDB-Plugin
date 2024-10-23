
import { Module } from "../../app/node_modules/@nestjs/common";

import {
  GameVaultPluginModule,
  GameVaultPluginModuleMetadataV1,
} from "../../app/dist/src/globals";
import { MetadataModule } from "../../app/dist/src/modules/metadata/metadata.module";
import { VndbMetadataProviderService } from "./vndb.metadata-provider.service";

@Module({
  imports: [
    MetadataModule, // You can use any modules of GameVault here
  ],
  controllers: [
     // You can provide your own API endpoints
  ],
  providers: [VndbMetadataProviderService],
})
export default class VndbMetadataProviderPluginModule implements GameVaultPluginModule {
  metadata: GameVaultPluginModuleMetadataV1 = {
    name: "VNDB Metadata Provider",
    author: "nosyrbllewe",
    version: "1.0.0",
    description:
      "Adds VNDB as a metadata provider for GameVault",
    keywords: ["metadata", "provider", "vndb", "visual novels"],
    license: "UNLICENSE",
    website: "",
  };
}