# AsyncTracker

> [!WARNING]  
> This repository has been moved to https://codeberg.org/duin/AsyncTracker

The `AsyncTracker` provides a mechanism for tracking asynchronous operations in Node.js. It uses the `async_hooks` module to track the lifecycle of asynchronous resources.

## Install

```shell
npm i @j-o-r/asynctracker --save
```

## Constructor

- **AsyncTracker()**
  - Constructs a new instance of the `AsyncTracker`.

## Methods

- **enable(type: string)**
  - Enables tracking of asynchronous methods. Optionally, only methods of a specified type can be tracked.
  - `type` (optional): The type of asynchronous method to track. If not specified, all types are tracked.

- **disable()**
  - Disables the tracking of asynchronous methods.

- **reset()**
  - Clears all tracked asynchronous methods.

- **report(verbose: boolean)**
  - Prints an overview of active asynchronous calls.
  - `verbose` (optional): If `true`, prints detailed information. Defaults to `false`.

- **getUnresolved(type: string)**
  - Returns an array of unresolved asynchronous methods, optionally filtered by type.
  - `type` (optional): The type of asynchronous methods to filter by.

- **getTypeDescription(type: string)**
  - Returns a description of the specified asynchronous method type.
  - `type`: The type of asynchronous method.

- **addCustomType(type: string, description: string)**
  - Adds or overwrites a custom type for asynchronous methods.
  - `type`: The type of the asynchronous method.
  - `description`: The description of the type.

## Usage Example

```javascript
import AsyncTracker from '@j-o-r/asynctracker';

const tracker = new AsyncTracker();
tracker.enable();
// Perform asynchronous operations...
const count = tracker.report(true); // Prints detailed information about active async calls
```


### Additional Information

- The AsyncTracker class uses various predefined types for asynchronous operations like Promise, Timeout, Immediate, etc.
- Custom types can be added using the addCustomType method for specialized tracking.
- The report method is useful for debugging purposes to get insights into ongoing asynchronous operations.

### TYPES

- TIMERWRAP: `setTimeout(), setInterval()`
- PROMISE: `Promise`
- IMMEDIATE: `setImmediate()`
- PROCESSNEXTTICK: `process.nextTick()`
- TICKOBJECT: Used internally by `process.nextTick()`
- SCRIPT: `vm.Script.runInThisContext()`
- PROMISEEXECUTOR: Used internally by `Promise`
- TIMEOUT: `setTimeout()`
- PIPECONNECTWRAP: Used by pipes
- PIPEWRAP: Used by pipes
- TCPCONNECTWRAP: Used by TCP sockets
- TCPWRAP: Used by TCP sockets
- GETADDRINFOREQWRAP: Used by DNS queries
- GETNAMEINFOREQWRAP: Used by DNS queries
- QUERYWRAP: Used by DNS queries
- FSREQCALLBACK: Used by FS operations
- FILEHANDLE: Used by file handles
- SIGNALWRAP: Used by signal handlers
- HTTPPARSER: Used by HTTP parsing
- HTTP2SESSION: Used by HTTP/2 sessions
- HTTP2STREAM: Used by HTTP/2 streams
- ZLIB: Used by Zlib
- TTYWRAP: Used by TTY handles
- UDPSENDWRAP: Used by UDP sockets
- UDPWRAP: Used by UDP sockets
- WRITEWRAP: Used by `process.stdout` and `process.stderr`
- SHUTDOWNWRAP: Used by `socket.end()`
