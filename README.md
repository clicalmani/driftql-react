# DriftQL React 🚀

The declarative ORM for your React components. Simplify data retrieval with a backend-like syntax directly in your JSX.

## 🌟 Why use DriftQL?

Stop writing repetitive `useEffect` and `useState` statements for every API call. **DriftQL** handles state, loading, errors, and DOM data injection for you.

Ideal for React applications using an "Inertia" architecture or structured APIs.

## ✨ Features

*   🎯 **Syntaxe Fluent** : Chaining of conditions (`where`, `orderBy`, `limit`) as in the backend.
*   🪄 **Auto-Attributs (Magic Data Binding)** : Automatically inject the retrieved data into the attributes of your DOM elements (e.g., automatically fills the `src` of an image).
*   ⚛️ **Render Props** : Total flexibility to build your UI with fresh data.
*   🛠️ **États UI intégrés** : Simplified handling of load (`onLoadStart`) and error (`onComplete`) states.
*   🔌 **Polymorphe** : Use any HTML tag (`div`, `img`, `span`, etc.) via the `as` prop.

## 📦 Installation

```bash
npm install driftql-react
# ou
yarn add driftql-react
```

## 🚀 Quick Start

### 1. "Automatic Injection" mode (The simplest)
Perfect for loading images or metadata without writing display logic. The component automatically updates the `src` attribute when the data arrives.

```tsx
import { Elegant } from 'driftql-react';

// L'attribut 'src' sera automatiquement rempli par 'avatar' depuis l'API
<Elegant 
  as="img" 
  resource="Employee" 
  id="2" 
  data-src="avatar" 
  onLoadStart={(element: HTMLImageElement) => element.src = 'loading.png'}
/>
```

### 2. "Render Props" mode (The most powerful)
For total control over what you display.

```tsx
import { Elegant } from 'driftql-react';

<Elegant 
  resource="Employee" 
  id="2"
>
  {(loading, error, data) => (
    <div className="card">
      {data ? (
        <>
          <h2>{data.name}</h2>
          <img src={data.avatar} alt={data.name} />
        </>
      ) : null}
    </div>
  )}
</Elegant>
```

## 🎛️ Advanced Use

You can filter, sort and limit the results directly via the props:

```tsx
<Elegant
  resource="Post"
  wheres={[{ column: 'status', operator: '=', value: 'published' }]}
  orders={[{ column: 'created_at', direction: 'DESC' }]}
  limit={10}
>
  {(loading, error, posts) => (
    <ul>
      {posts?.map(post => <li key={post.id}>{post.title}</li>)}
    </ul>
  )}
</Elegant>
```

## 📚 API Reference

### Props

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `resource` | `string` | *Requis* | The name of the model to query (e.g., 'User'). |
| `id` | `string \| number` | `undefined` | The unique identifier to retrieve a single item. |
| `wheres` | `WhereClause[]` | `[]` | Table of conditions for filtering the results. |
| `orders` | `OrderClause[]` | `[]` | Sorting table. |
| `limit` | `number` | `undefined` | Limits the number of results. |
| `offset` | `number` | `0` | Offset for pagination. |
| `as` | `ElementType` | `'div'` | The HTML tag or React component to render. |
| `onLoadStart` | `(element: HTMLElement) => void` | `null` | Callback called before loading. |
| `onComplete` | `(element: HTMLElement) => void` | `null` | Callback called on complete. |
| `children` | `RenderProp \| ReactNode` | `null` | Either a React node, or a function receiving the data. |

## ⚙️ Configuration

---

## 📝 Licence

MIT

---

**💡 Astuce :** This package is designed to work in conjunction with Tonka PHP Framework. Make sure you have configured your server-side template whitelist!