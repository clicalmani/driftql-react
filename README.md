Here is the updated and polished **README.md** in English, incorporating all your specific requirements regarding the configuration files, usage examples, and the Tonka Framework context.

***

# DriftQL React 🚀

The bridge between your **Tonka Framework** application and React. Seamlessly expose your **Elegant ORM** models to the frontend with a powerful, secure, and declarative API.

## 🌟 Features

*   🪄 **Auto-Data Binding**: Inject ORM data directly into DOM attributes (e.g., auto-fill an `img src`).
*   ⚛️ **Flexible Usage**: Supports both simple attribute injection and advanced Render Props with loading/error states.
*   🔒 **Secure by Design**: Built-in support for API keys, model whitelisting, and strict SQL sanitization via your DriftQL backend.
*   🎯 **Fluent Querying**: Use `where`, `orderBy`, and `limit` directly in your components, just like in your backend code.
*   🛠️ **Lifecycle Hooks**: Handle `onLoadStart` and `onComplete` for fine-grained control over the loading state.

## 📦 Installation

```bash
npm install driftql-react
# or
yarn add driftql-react
```

## ⚙️ Configuration

### 1. Frontend Configuration

Create a configuration file (e.g., `drift.config.js`) at the root of your project.

```javascript
// drift.config.js
export default {
  // The base URL of your DriftQL backend bridge
  baseURL: '/api/bridge',
  
  // Request timeout in milliseconds
  timeout: 5000,
  
  // Cache strategy (RequestCache)
  cache: 'default', 
  
  // The public key required to authenticate requests with the backend
  bridge_public_key: 'd3597f10e13310490809c832b898445e88face0bb7635b846d1b651f62417a29'
};
```

Then, initialize the package in your entry file (e.g., `main.tsx` or `App.js`):

```javascript
import { DriftQL } from 'driftql-react';
import config from './drift.config';

DriftQL.init(config);
```

### 2. Backend Configuration (Laravel / PHP)

Configure your DriftQL bridge to secure and control data access.

```php
// config/driftql.php
<?php

return [
    /*
    |--------------------------------------------------------------------------
    | DRIFTQL BRIDGE ENABLED
    |--------------------------------------------------------------------------
    */
    'enabled' => env('DRIFTQL_BRIDGE_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | DRIFTQL BRIDGE KEY
    |--------------------------------------------------------------------------
    | A secret key that the front-end must provide to access the DriftQL bridge.
    | This is an additional layer of security to prevent unauthorized access.
    */
    'bridge_public_key' => env('DRIFTQL_BRIDGE_KEY', 'your-public-key-here'),

    /*
    |--------------------------------------------------------------------------
    | MODEL WHITELIST
    |--------------------------------------------------------------------------
    | List of models (classes) that the front-end is allowed to query. 
    | If a model is not in this list, the query is rejected immediately.
    */
    'whitelist' => [
        'allowed_models' => [
            \App\Models\User::class,
            \App\Models\Employee::class,
            // Note : \App\Models\Admin is not here, so it is inaccessible via this route
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | AUTHORIZATION (Policies & Row Level Security)
    |--------------------------------------------------------------------------
    | Defines access restrictions by Role and by Model. 
    | The backend automatically applies these "Global Scopes".
    |
    | Format :
    | 'ModelName' => [
    |      'RoleName' => [ Filtering rule ]
    | ]
    */
    'policies' => [
        \App\Models\User::class => [
            // Admins see everything (no filter)
            'admin' => null, 
            
            // Editors cannot see other admins
            'editor' => [
                'column' => 'role',
                'operator' => '!=',
                'value' => 'admin', 
            ],
            
            // Standard users only see themselves
            'user' => [
                'column' => 'id',
                'operator' => '=',
                'value' => 'current_user_id',
            ],
        ],
        
        // You can also specify a custom Policy class instead of an array.
        // The class must implement \Tonka\DriftQL\Security\Contract.
        \App\Models\Post::class => \App\Policies\Drift\PostPolicy::class,
    ],

    /*
    |--------------------------------------------------------------------------
    | HARDCODED LIMITATION (DoS Protection)
    |--------------------------------------------------------------------------
    | Enforce ceilings to protect database performance.
    */
    'limits' => [
        // Maximum number of records the front end can request at once
        'max_limit' => 100, 
        
        // Default number if the front does not specify a limit
        'default_limit' => 20,
        
        // Maximum number allowed for the offset (to avoid excessively deep pagination)
        'max_offset' => 10000,
    ],

    /*
    |--------------------------------------------------------------------------
    | SQL SANITIZATION
    |--------------------------------------------------------------------------
    | Security guidelines for constructing the request.
    */
    'security' => [
        // The use of "raw SQL" from the front end is strictly prohibited.
        // Only structured "where" clauses (column, operator, binding) are accepted.
        'allow_raw_sql' => false,

        // Checks that the columns requested in 'orderBy' or 'where' actually exist
        // in the database schema.
        'strict_column_check' => true,
    ],
];
```

---

## 🚀 Usage

### 1. Simple Usage (Auto-Binding Mode)

Perfect for loading images or metadata directly into HTML elements without writing render logic. The component will automatically inject the fetched data into the specified DOM attribute.

**Example:** Load a user avatar directly into an `<img />` tag.

```tsx
import { Elegant } from 'driftql-react';

<Elegant
  as="img"
  resource="User"
  id={1}
  data-src="avatar_url"      // Maps 'avatar_url' from DB to the 'src' attribute
  onLoadStart={(img: HTMLImgElement) => img.src = "loading.png"}
  onComplete={(img: HTMLImgElement) => {
    // Do something when the image is loaded, e.g., fade in effect
    img.style.opacity = '1';
  }}
/>
```

### 2. Advanced Usage (Render Props Mode)

For complex UIs where you need full control over the Loading, Error, and Data states. The `children` prop accepts a function with the signature `(loading, error, data)`.

```tsx
import { Elegant } from 'driftql-react';

<Elegant
  resource="Post"
  wheres={[
    { column: 'status', operator: '=', value: 'published' }
  ]}
  orders={[
    { column: 'created_at', direction: 'DESC' }
  ]}
  limit={10}
>
  {(loading, error, posts) => {
    if (loading) return <Spinner />;
    if (error) return <ErrorMessage error={error} />;
    
    return (
      <ul>
        {posts?.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    );
  }}
</Elegant>
```

## 📚 API Reference

### Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `resource` | `string` | *Required* | The Elegant model name to query (e.g., 'User'). |
| `id` | `string \| number` | `undefined` | The ID to fetch a specific record. |
| `wheres` | `WhereClause[]` | `[]` | Array of conditions to filter the query. |
| `orders` | `OrderClause[]` | `[]` | Array of sorting rules. |
| `limit` | `number` | `undefined` | Limit the number of results. |
| `offset` | `number` | `0` | Offset for pagination. |
| `as` | `ElementType` | `'div'` | The HTML tag or React component to render. |
| `data-*` | `string` | `undefined` | Maps a DB field to a DOM attribute (e.g., `data-src="avatar"`). |
| `onLoadStart` | `(el: HTMLElement) => void` | `undefined` | Callback triggered when the fetch starts. |
| `onComplete` | `(el: HTMLElement) => void` | `undefined` | Callback triggered when data is successfully loaded. |
| `children` | `RenderProp \| ReactNode` | `null` | Either a React Node or a function `(loading, error, data) => ReactNode`. |

## 🔐 Security Note

DriftQL is designed to expose your ORM securely. Ensure your backend `whitelist` and `policies` are correctly configured to prevent unauthorized data access. The `bridge_public_key` ensures that only your frontend application can communicate with the bridge.

## 📝 License

MIT