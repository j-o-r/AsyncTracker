
// Copyright 2023 J.H. Duin
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import async_hooks from 'async_hooks';

/**
 * @typedef {Object} AsyncHookItem
 * Represents an item in the async hooks tracking.
 * 
 * @property {number} key - The unique identifier for the async operation.
 * @property {string} type - The type of the async operation, e.g., 'PROMISE'.
 * @property {number} triggerAsyncId - The async ID of the resource that triggered this operation.
 * @property {string} stack - The call stack trace when the async operation was initialized.
 * @property {Promise|Timeout|Immediate|TCPWrap|TCPSERVERWRAP|UDPWrap|FSReqCallback|HTTPParser|PipeWrap|PipeConnectWrap|StreamWrap|TtyWrap|Process|SignalWrap|TimerWrap} resource - The Promise object associated with this operation, including its state and async IDs.
 */
const TYPES = {
	TIMERWRAP: 'setTimeout(), setInterval()',
	PROMISE: 'Promise',
	IMMEDIATE: 'setImmediate()',
	PROCESSNEXTTICK: 'process.nextTick()',
	TICKOBJECT: 'Used internally by process.nextTick()',
	SCRIPT: 'vm.Script.runInThisContext()',
	PROMISEEXECUTOR: 'Used internally by Promise',
	TIMEOUT: 'setTimeout()',
	PIPECONNECTWRAP: 'Used by pipes',
	PIPEWRAP: 'Used by pipes',
	TCPCONNECTWRAP: 'Used by TCP sockets',
	TCPWRAP: 'Used by TCP sockets',
	GETADDRINFOREQWRAP: 'Used by DNS queries',
	GETNAMEINFOREQWRAP: 'Used by DNS queries',
	QUERYWRAP: 'Used by DNS queries',
	FSREQCALLBACK: 'Used by FS operations',
	FILEHANDLE: 'Used by file handles',
	SIGNALWRAP: 'Used by signal handlers',
	HTTPPARSER: 'Used by HTTP parsing',
	HTTP2SESSION: 'Used by HTTP/2 sessions',
	HTTP2STREAM: 'Used by HTTP/2 streams',
	ZLIB: 'Used by Zlib',
	TTYWRAP: 'Used by TTY handles',
	UDPSENDWRAP: 'Used by UDP sockets',
	UDPWRAP: 'Used by UDP sockets',
	WRITEWRAP: 'Used by process.stdout and process.stderr',
	SHUTDOWNWRAP: 'Used by socket.end()',
};
/*
--- resourceTypes ---
	'Promise',
	'Timeout',
	'Immediate',
	'TCPWrap',
	'TCPSERVERWRAP',
	'UDPWrap',
	'FSReqCallback',
	'HTTPParser',
	'PipeWrap',
	'PipeConnectWrap',
	'StreamWrap',
	'TtyWrap',
	'Process',
	'SignalWrap',
	'TimerWrap'
*/
const getTypeDescription = (type) => {
	if (TYPES[type]) return TYPES[type];
	const err = `Unknown type: ${type}`;
	throw new Error(err);
}

class AsyncTracker {
	#enabled = false;
	#filter = '';
	#storage = new Map();
	/** @type {import('async_hooks').AsyncHook} */
	#hook;
	constructor() {
	}
	/** 
	* 'arm' the registration of async methods
	* @private 
	*/
	#arm() {
		if (this.#hook) {
			this.#hook.disable();
		}
		this.#storage.clear();
		const storage = this.#storage;
		const filter = this.#filter
		this.#hook = async_hooks.createHook({
			init(asyncId, type, triggerAsyncId, resource) {
				type = type.toUpperCase();
				if (filter === '' || filter === type) {
					const stackLines = new Error().stack.split("\n");
					const stack = stackLines.slice(5, 9).join("\n").trim();
					storage.set(asyncId, { type, triggerAsyncId, stack, resource });
				}
			},
			destroy(asyncId) {
				// `destroy` is called by the garbage collector once resolved/runned
				storage.delete(asyncId);
			},
			promiseResolve(asyncId) {
				storage.delete(asyncId);
			}
		});
	}

	/** 
	* Enables tracking of asynchronous methods. Optionally, only methods of a specified type can be tracked.	
	* @param {string} [type] - optional only register async methods from a specific type 
	*/
	enable(type = '') {
		type = type.toUpperCase();
		if (type !== '' && !TYPES[type]) {
			const err = `Unknown type: ${type}`;
			throw new Error(err);
		}
		this.#filter = type;
		this.#arm();
		this.#enabled = true;
		this.#hook.enable()
	}
	/**
	* Disables the tracking of asynchronous methods. 
	*/
	disable() {
		if (this.#hook) this.#hook.disable();
		this.#enabled = false;
	}
	/** 
	* Clears all tracked asynchronous methods.	
	*/
	reset() {
		this.#storage.clear();
	}
	/*
	* Prints an overview of active asynchronous calls.
	* @param {boolean} [verbose] - default false, print an overview of active async calls
	* @returns {number} Number of active, unresolved async calls
	*/
	report(verbose = false) {
		if (this.#enabled) {
			this.#hook.disable();
		}
		const size = this.#storage.size;
		if (verbose) console.log(` - active async methods:  ${size} - `);
		if (verbose) {
			let i = 0;
			this.#storage.forEach((value, key) => {
				i++;
				console.log(`Async resource of type ${value.type} with ID ${key}:`);
				console.log(`Stack: ${value.stack}\n`);
				console.log(`Resource: ${value.resource}\n`);
			});
		}

		if (this.#enabled) {
			this.#hook.enable();
		}
		return size;
	}
	/**
	* Returns an array of unresolved asynchronous methods, optionally filtered by type	
	* @param {string} [type] - The type of async methods to filter by
	* @returns {AsyncHookItem[]}
	*/
	getUnresolved(type) {
		if (this.#enabled) {
			this.#hook.disable();
		}
		if (type) type = type.toUpperCase();
		let items = Array.from(this.#storage, ([key, value]) => ({ key, ...value }));
		if (type) {
			items = items.filter(item => item.type === type);
		}
		if (this.#enabled) {
			this.#hook.enable();
		}
		return items;
	}
	/**
	* Returns a description of the specified asynchronous method type	
	* @param {string} type - The type of asynchronous method.
	* @returns {string}
	*/
	getTypeDescription(type) {
		type = type.toUpperCase();
		return getTypeDescription(type)
	}

	/**
	* Adds or overwrites a custom type for asynchronous methods.	
	* @param {string} type - The type of asynchronous method.
	* @param {string} description - the description
	* @returns {string}
	*/
	addCustomType(type, description) {
		type = type.toUpperCase();
		TYPES[type] = description;
	}
}

export default AsyncTracker;
