# entities-extractor

Extract entities from a context. Entities are [Named-entities](https://en.wikipedia.org/wiki/Named-entity_recognition), learned by Entitizer.

## Usage
```
var Extractor = require('entitizer.entities-extractor');
var extractor = new Extractor();
var context = {text:'Some long text... London.',lang:'en',country:'us'};
extractor.extract(context)
  .then(function(entities) {

  });
```

## API

### extract(context[, concepts])

Extracts entities from a context.

### concepts(context)

Parse concepts from a context. Concepts are parts of text that can be an Entity.
