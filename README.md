# prostojs/http

As an alternative for `express` and `fastify` this `@prostojs/http` brings the whole different approach for processing http requests.
It utilizes such a technique as you can see in React Hooks or Vue Composables. It has only a dependency on [@prostojs/router](https://github.com/prostojs/router) (an alternative to `find-my-way` used by `fastify`) which is a very fast (see benchmarks [here](https://github.com/prostojs/router-benchmark)) and robust URI router. 

`@prostojs/http` supports cookie parsing and serving files out of the box with no impact on performance.

The main ideas behind this http-server implementation are:

1. Never mutate request object (`req`). Accumulate a request context in a separate object(s) instead;
2. Never parse anything (cookies, body) before it is really requested by the request handler;
3. Get rid of complex predefined data objects containing everything (cookies, headers, body, parsed body etc.) and use composable functions instead;
4. Get rid of tons of dependencies (middlewares) and implement everything that is needed for http server in a simple way.


## Quick Start

```js
const { ProstoHttpServer } = require('@prostojs/http')

const app = new ProstoHttpServer()

app.get('test', () => {
    return { message: 'hello world!' }
})

app.listen(3000, () => { console.log('@prosto/http Server is up on port 3000') })
```

## Install

`npm install @prostojs/http`

## Routes

It supports static, parametric and wildcard routes with regex expressions (see details in [@prostojs/router](https://github.com/prostojs/router))

Static route:
```js
app.get('static/route', () => {})
```

Parametric route:
```js
app.get('parametric/:param1/:param2/...', () => {})
```

Wildcard route:
```js
app.get('wildcard/*', () => {})
```

Complex wildcard route (use as many asterisks as you need and even specify a static parts after them):
```js
app.get('wildcard/start-*/*.html', () => {})
```


## URL Parameters

To get access to URL parameters use composable function `useRouteParams`

```js
import { useRouteParams } from '@prostojs/http'
app.get('parametric/:param1/:param2/...', () => {
    const { routeParams, getRouteParam } = useRouteParams()
    // presume we had a request on `/parametric/value1/value2`
    console.log('param1=' + getRouteParam('param1'))
    // prints "param1=value1"
    console.log('param2=' + getRouteParam('param2'))
    // prints "param2=value2"
    console.log(routeParams)
    // prints {
    //   param1: "value1",
    //   param2: "value2" 
    // }
})
```

## Query Parameters

To get access to Query parameters use composable function `useSearchParams`

```js
import { useSearchParams } from '@prostojs/http'
app.get('with-query', () => {
    const { jsonSearchParams, urlSearchParams } = useSearchParams()
    // presume we had a request on `/with-query?param1=abc&param2=cde`
    console.log('param1=' + urlSearchParams('param1'))
    // prints "param1=abc"
    console.log('param2=' + urlSearchParams('param2'))
    // prints "param1=cde"
    console.log(jsonSearchParams)
    // prints {
    //   param1: "abc",
    //   param2: "cde"   
    // }
})
```

## Request

To get a reference to the raw request instance use composable function `useRequest`

```js
import { useRequest } from '@prostojs/http'
app.get('test', () => {
    const { rawRequest } = useRequest()
})
```

### Request Method, Headers, ...

`useRequest` provides some more shortcuts for useful data

```js
import { useRequest } from '@prostojs/http'
app.get('test', async () => {
    const { 
        url,        // request url      (string) 
        method,     // request method   (string)
        headers,    // request headers  (object)
        rawBody,    // request body     ((): Promise<Buffer>)
    } = useRequest()

    const body = await rawBody() // body as a Buffer
})
```

### Request Cookies

Cookies are not parsed unless requested. Composable function `useCookies` provides cookie getter and raw cookies string.

```js
import { useCookies } from '@prostojs/http'
app.get('test', async () => {
    const { 
        rawCookies, // "cookie" from headers (string | undefined)
        getCookie,  // cookie getter ((name): string | null)
    } = useCookies()

    console.log(getCookie('session'))
    // prints the value of the cookie with the name "session"
})
```

### Request Body Parser

Function `useBody` provides utilities for getting decoded and parsed body.

Body parser supports json, string, multipart/form-data and application/x-www-form-urlencoded content-types.

Body parser does not parse every request's body. The parsing happens only when you call `parseBody` function.

The request handler is invoked even before the request body was sent to the server.

```js
import { useBody } from '@prostojs/http'
app.post('test', async () => {
    const {
        isJson, // checks if content-type is "application/json" : () => boolean;
        isHtml, // checks if content-type is "text/html" : () => boolean;
        isXml, // checks if content-type is "application/xml" : () => boolean;
        isText, // checks if content-type is "text/plain" : () => boolean;
        isBinary, // checks if content-type is binary : () => boolean;
        isFormData, // checks if content-type is "multipart/form-data" : () => boolean;
        isUrlencoded, // checks if content-type is "application/x-www-form-urlencoded" : () => boolean;
        isCompressed, // checks content-encoding : () => boolean | undefined;
        contentEncodings, // returns an array of encodings : () => string[];
        parseBody, // parses body according to content-type : <T = unknown>() => Promise<T>;
        rawBody, // returns raw body Buffer : () => Promise<Buffer>;
    } = useBody()

    // the handler got the control, but the body isn't loaded yet
    //...

    console.log(await parseBody())

    // after `await parseBody()` the body was loaded and parsed
    // ...
})
```

### Request Authorization

`useAuthorization` function provides useful helpers for auth-headers:

```js
import { useAuthorization } from '@prostojs/http'
app.get('test', async () => {
    const {
        authorization,      // the raw value of "authorization" header : string
        authType,           // the auth type (Bearer/Basic) : string
        authRawCredentials, // the auth credentials that follow auth type : string
        isBasic,            // true if authType === 'Basic' : () => boolean
        isBearer,           // true if authType === 'Bearer' : () => boolean
        basicCredentials,   // parsed basic auth credentials : () => { username: string, password: string }
    } = useAuthorization()

    if (isBasic()) {
        const { username, password } = basicCredentials()
        console.log({ username, password })
    } else if (isBearer()) {
        const token = authRawCredentials
        console.log({ token })
    } else {
        // unknown or empty authorization header
    }
})
```

## Response

To get a reference to the raw response instance use composable function `useResponse`

An example of using raw response instance. When you get a raw response instance you take away the control of the response on yourself. The framework will not process the output of the handler in this case.
```js
import { useResponse } from '@prostojs/http'
app.get('test', () => {
    const { rawResponse } = useResponse()
    const res = rawResponse()
    res.writeHead(200, {})
    res.end('ok')
})
```

If you don't want to take away a responsibility for the response but still need a raw response instance you can use `{ passthrough: true }` as an argument.
The next example does the same thing as the previous example using `passthrough` options:

```js
import { useResponse } from '@prostojs/http'
app.get('test', () => {
    const { rawResponse } = useResponse()
    const res = rawResponse({ passthrough: true })
    return 'ok'
})
```

### Response Headers

A function `useSetHeaders` provides variety of response headers helpers:

```js
import { useSetHeaders, contentTypes } from '@prostojs/http'
app.get('test', async () => {
    const {
        setHeader,      //sets header: (name: string, value: string | number) => void;
        removeHeader,   //removes header: (name: string) => void;
        setContentType, //sets "Content-Type": (value: string) => void;
        headers,        //Object with response headers: Record<string, string>;
        enableCors,     //sets "Access-Control-Allow-Origin": (origin?: string) => void;
    } = useSetHeaders()

    setContentType(contentTypes.application.json)
    setHeader('server', 'myServer v1.0')
    enableCors()
    return '{ "value": "OK" }'
})
```

### Response Cookies (Set-Cookie)

A function `useSetCookies` provides variety of set-cookie helpers:

```js
import { useSetCookies } from '@prostojs/http'
app.get('test', async () => {
    const {
        setCookie,      // sets cookie : (name: string, value: string, attrs?) => void;
        removeCookie,   // removes cookie from setlist : (name: string) => void;
        clearCookies,   // removes all the cookies from setlist : () => void;
        cookies,        // returns a value of Set-Cookie header: () => string[];
    } = useSetCookies()

    setCookie('session', {
        expires: '2029-01-01',  // Date | string | number;
        maxAge:  '1h',          // number | TProstoTimeMultiString;
        domain:  'my-domain',   // string;
        path:    '/home',       // string;
        secure:   true,         // boolean;
        httpOnly: false,        // boolean;
        sameSite: true,         // boolean | 'Lax' | 'None' | 'Strict';
    })
})
```

### Response Status

It's possible to control the response status via `status` function that is available in `useResponse()`

```js
import { useResponse } from '@prostojs/http'
app.get('test', async () => {
    const { status } = useResponse()
    status(201) // sets status 201 for the response
    console.log(status()) // when called with no argument returns the status
    return 'response with status 201'
})
```

### Cache-Control

_WIP_

### Serve File (Serve-Static)

Function `serveFile` returns a readable stream and prepares all the neccessary response headers (like content-length, content-type etc).

It can handle etag and range as well.

Built-in file server example:

```js
import { serveFile, useRouteParams } from '@prostojs/http'
app.get('static/*', () => {
    const { getRouteParam } = useRouteParams()
    return serveFile(getRouteParam('*'), { cacheControl: { maxAge: '10m' } })
})
```

## Error Handling

All the exeptions occured in handler are cought by the framework and interpreted as Server Error 500.


```js
app.get('error', () => {
    throw new Error('Some Error')
    // A call of this endpoint will result in
    // 500 Internal Server Error
    // "Some Error"
})
```

By default the Error Handler renders the response according to the `Accept` request header:
- if it accepts 'application/json' then the response will be in JSON format
- else if it accepts 'text/html' then the response will be in HTML format
- else if it accepts 'text/plain' then the response will be rendered in a plain text
- else the response will be in JSON format anyways

It's possible to return your own error:

```js
import { ProstoHttpError } from '@prostojs/http'
app.get('error', () => {
    throw new ProstoHttpError('429', 'My Description')
    // A call of this endpoint will result in
    // 429 Too Many Requests
    // "My Description"
})
```

In this case if you have an alternative (fallback) handler for the same route the error may not occure, the next handler will be called instead.

As an alternative you may not throw the error but return its instance:

```js
import { ProstoHttpError } from '@prostojs/http'
app.get('error', () => {
    return new ProstoHttpError('429', 'My Description')
    // A call of this endpoint will result in
    // 429 Too Many Requests
    // "My Description"
})
```

In this case if you have an alternative (fallback) handler for the same route the error will occure anyways as you explicitly return its instance.

## Alternative (Fallback) Handler

It's possible to assign several handlers for the same route. Every next handler will work as a fallback for the previous one.

The fallback handler is called only when exception is thrown out of the previous handler.

If the previous handler returns an Error Instance then the fallback handler won't be called.

For example you serve files, but for some 'not found' files you want to do something else:

```js
import { ProstoHttpServer, serveFile, useRouteParams } from '@prostojs/http'
const app = new ProstoHttpServer()

app.get('static/*', () => {
    const { getRouteParam } = useRouteParams()
    // serveFile will throw 404 error if the file is not found
    return serveFile(getRouteParam('*'), { maxAge: '10m' })
})

app.get('static/*', () => {
    // this handler will be called every time the file is not found
    return 'Here\'s my fallback response'
})

app.listen(3000)
```

In order to prevent the fallback to be invoked you must return an Error Instance explicitly:

```js
import { ProstoHttpServer, serveFile, useRouteParams } from '@prostojs/http'
const app = new ProstoHttpServer()

app.get('static/*', () => {
    const { getRouteParam } = useRouteParams()
    try {
        return serveFile(getRouteParam('*'), { maxAge: '10m' })
    }
    catch (e) {
        // now we catch error and return it explicitly
        return e
    }
})

app.get('static/*', () => {
    // this handler will be never called now
    return 'Here\'s my fallback response which is never (ever) called'
})

app.listen(3000)
```
