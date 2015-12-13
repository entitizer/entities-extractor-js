# entities-extractor

Extract entities from a context. Entities are [Named-entities](https://en.wikipedia.org/wiki/Named-entity_recognition), learned by Entitizer.

## Usage
```
var extractor = require('entitizer.entities-extractor');
var context = {text:'Some long text... London.',lang:'en',country:'us'};
extractor.fromContext(context)
  .then(function(entities) {

  });
```

## API

### fromContext(context, options)

Extracts entities from a context.

- `context` (Object) **required**:
  + `text` (String) **required** - Text to search in;
  + `lang` (String) **required** - language code: `en`, `ru`;
  + `country` (String) **required** - country code: `it`, `ro`;
- `options` (Object) **optional**:
  + `conceptsOptions` (Object) **optional** - `options` to use on finding concepts. See [concepts-parser](https://github.com/entitizer/concepts-parser-js) options;
  + `accessService` (Object) **optional** - an entities [AccessService](https://github.com/entitizer/entities-storage-js) object;

### fromConcepts(context, concepts, options)

Extracts entities from concepts.

- `context` (Object) **required**:
  + `lang` (String) **required** - language code: `en`, `ru`;
  + `country` (String) **required** - country code: `it`, `ro`;
- `concepts` (Concept[]) **required** - a list of concepts, returned by [concepts-parser](https://github.com/entitizer/concepts-parser-js)
- `options` (Object) **optional** - options:
  + `accessService` (Object) **optional** - an entities [AccessService](https://github.com/entitizer/entities-storage-js) object;

## Entity object:

- `id` (Number)
- `name` (String)
- `slug` (String)
- `type` (String)
- `concepts` (Concept[]) - an array of concepts
