# Image naming audit (Task 13)

Rule: one representative picture is a thumbnail, a collection is images, and a person's picture is an avatar. The audit searched API, shared contracts, SDK, server-core, web, Stay, seeders, tests, OpenAPI metadata/platform docs and READMEs for image/imageId/imageIds/imageUrl/imageStorageId(s)/photo/picture/cover/media before editing.

| Location | Previous name | Actual role | Current name |
| --- | --- | --- | --- |
| products DB, model, association, seeds | image_id / imageId / image | thumbnail | thumbnail_id / thumbnailId / thumbnail |
| Product create/update | imageStorageId | thumbnail | thumbnailStorageId |
| Product create/update | imageStorageIds | images | unchanged |
| Product list/detail, catalog, dashboard | imageUrl | thumbnail | thumbnailUrl |
| Product detail | imageId and imageUrl only | thumbnail | thumbnail: { fileId, url, storageId } or null; thumbnailId/thumbnailUrl named explicitly |
| Product gallery DTO | images without storageId | images | images with storageId |
| POST /products/:id/images | imageStorageId | individual attachment to images | storageId |
| ProductImage rows and DELETE route, route-policy resource parameter | product_images / fileId / imageId | images, individual gallery-row identifier | unchanged |
| SKU model, editor, API | imageIds / image_ids | images | unchanged |
| Cart, quote, order items, order snapshots | imageUrl / image_url | thumbnail snapshot | thumbnailUrl / thumbnail_url |
| Auth/profile/account requests | imageStorageId | avatar | avatarStorageId |
| User model / response / seed | avatarId / avatarUrl | avatar | unchanged |
| Review requests, DTO, model, DB | mediaIds / media_ids | images (review-purpose uploads accept image MIME types) | imageIds / image_ids |
| Content drafts, publications, revisions | coverFileId / cover_file_id / coverUrl | thumbnail | thumbnailFileId / thumbnail_file_id / thumbnailUrl |
| Published content | media | images | images |
| Merchandising banner payload / public DTO | imageFileId / imageUrl | thumbnail | thumbnailFileId / thumbnailUrl |
| File reference counting | asCover / cover SQL replacement | thumbnail | asThumbnail / thumbnail; queries include renamed content/banner/review fields |
| Product form translations and upload | cover / first gallery item | thumbnail | independent AvatarUpload card; gallery contains images only |
| Validation translations | imageStorageId | mixed roles | thumbnailStorageId / avatarStorageId / imageStorageIds / storageId |
| Better Auth adapter and native schema | image mapped to avatar_url | avatar, external provider contract | keep native image; application DTO uses avatarId/avatarUrl |
| Content block discriminant, Cloudinary resource_type, MIME types, kit image props / MediaGallery | image / media | other: bitmap format, content block, external UI/provider APIs | unchanged |
| Processes, uploads and audit event identifiers | media.batch / media.completed | other: workflow/event identifiers | unchanged |
| Returns/support attachments; Stay readings, maintenance, CCCD, receipts, signatures | evidenceIds / attachmentIds / photo(s) / image | other: evidence/documents, independent Stay API | unchanged |
| Shop logo | logoFileId / logoUrl | other: brand identity | unchanged |
| CSS, generic prose | object-cover / media / coverage | other: CSS and ordinary language | unchanged |

All application contract changes flow through generated OpenAPI and SDK. The admin list and product form consume these names; the variant editor continues using gallery file IDs. Storefront home/shop/cart are currently placeholders; checkout/orders/account have no P4 image-field consumers to rename. Existing generic admin resource screens and exports inherit regenerated contract types/model mappings. Stay's image fields belong to its own API and do not consume the renamed P4 commerce fields. Exports query model attributes and inherit renamed DB mappings.

## Thumbnail behavior

`thumbnailStorageId` sets an independent thumbnail using the actor-owned product upload flow on create/update. It never inserts into product_images. Update null clears thumbnail_id; omission preserves it. Gallery membership does not bypass upload authorization. imageStorageIds appends gallery images only; adding/removing gallery images does not change the thumbnail. thumbnailUrl falls back to the first sorted gallery image for display while thumbnail stays null when unset.

The form uses a separate square, cropped AvatarUpload card before the gallery, uploads through createUploadApi.uploadFile on save, and supports clear. Gallery badges, selection, onSetThumbnail and its TODO were removed. The detail aside shows thumbnail and gallery separately, including an empty thumbnail state. Reference counting sums both thumbnail and gallery references, including files referenced in both roles.

## Data migration

`20261119000100-normalize-image-names.cjs` reversibly renames products.image_id, order_items.image_url, content_entries.cover_file_id, and reviews.media_ids. It renames content snapshot/revision and banner JSON keys, as well as thumbnail URLs inside order/checkout quote snapshot items, retaining item order and values. Quote fingerprints are recalculated using the same canonical JSON algorithm after a key rename. Historical migrations remain unchanged so existing migration history and full rollback still work.
