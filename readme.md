# entitizer.entities-extractor

Extract entities from a context. Entities are [Named-entities](https://en.wikipedia.org/wiki/Named-entity_recognition), stored/learned by Entitizer.

## Usage
```
var extractor = require('entitizer.entities-extractor');
var context = { text: 'Some long text... London.', lang: 'ro', country: 'md' };
extractor.extract(context)
  .then(data => {

  });
```

## API

### extract(context: Context, repository: Repository, formatKey: formatKeyFunc): Promise<ExtractData>

Extracts entities from a context and a repository.

Input data:

```ts
type Context = {
  text: string
  lang: string
  country?: string
}

export interface Repository<T extends Entity> {
    entitiesByIds(ids: string[]): Promise<T[]>
    entityIdsByKeys(keys: string[]): Promise<PlainObject<string[]>>
}

interface formatKeyFunc {
    (name: string, lang: string): string
}
```

Output data:

```ts
type ExtractData = {

}
```

## LICENSE

Private: Entitizer, Dumitru Cantea.
