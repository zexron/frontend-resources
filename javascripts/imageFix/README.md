# Image Fix
To compress images and fix orientation issue for ios (Canvas and promise needed)

## Usage
Include dep.js and func.js. 
```typescript
    let file:File = new File()
    imageFix(file).then((resultBlob:Blob) => {
      // some action with resultBlob
    })
```
