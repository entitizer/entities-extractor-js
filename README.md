# entitizer.entities-extractor

Extract entities from a context. Entities are [Named-entities](https://en.wikipedia.org/wiki/Named-entity_recognition), stored/learned by Entitizer.

## Usage
```
var extractor = require('entitizer.entities-extractor');
var context = { text: 'Some long text... London.', lang: 'ro', country: 'md' };
extractor.extract(context)
  .then(function(entities) {

  });
```

## API

## LICENSE

Private: Entitizer, Dumitru Cantea.
