#!/usr/bin/env node
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import AsyncTracker from '../src/AsyncTracker.js';

const test = suite('AsyncTracker');

const tracker = new AsyncTracker();

let active = 0;

test('report: counter should be 0', () => {
	active = tracker.report(true);
	assert.equal(active, 0)
});
test('getTypeDescription', () => {
	assert.equal(tracker.getTypeDescription('TIMERWRAP'), 'setTimeout(), setInterval()');
	assert.equal(tracker.getTypeDescription('PROMISE'), 'Promise');
	assert.equal(tracker.getTypeDescription('IMMEDIATE'), 'setImmediate()');
	assert.equal(tracker.getTypeDescription('PROCESSNEXTTICK'), 'process.nextTick()');
	assert.equal(tracker.getTypeDescription('TICKOBJECT'), 'Used internally by process.nextTick()');
	assert.equal(tracker.getTypeDescription('SCRIPT'), 'vm.Script.runInThisContext()');
	assert.equal(tracker.getTypeDescription('PROMISEEXECUTOR'), 'Used internally by Promise');
	assert.equal(tracker.getTypeDescription('TIMEOUT'), 'setTimeout()');
	assert.equal(tracker.getTypeDescription('PIPECONNECTWRAP'), 'Used by pipes');
	assert.equal(tracker.getTypeDescription('PIPEWRAP'), 'Used by pipes');
	assert.equal(tracker.getTypeDescription('TCPCONNECTWRAP'), 'Used by TCP sockets');
	assert.equal(tracker.getTypeDescription('TCPWRAP'), 'Used by TCP sockets');
	assert.equal(tracker.getTypeDescription('GETADDRINFOREQWRAP'), 'Used by DNS queries');
	assert.equal(tracker.getTypeDescription('GETNAMEINFOREQWRAP'), 'Used by DNS queries');
	assert.equal(tracker.getTypeDescription('QUERYWRAP'), 'Used by DNS queries');
	assert.equal(tracker.getTypeDescription('FSREQCALLBACK'), 'Used by FS operations');
	assert.equal(tracker.getTypeDescription('FILEHANDLE'), 'Used by file handles');
	assert.equal(tracker.getTypeDescription('SIGNALWRAP'), 'Used by signal handlers');
	assert.equal(tracker.getTypeDescription('HTTPPARSER'), 'Used by HTTP parsing');
	assert.equal(tracker.getTypeDescription('HTTP2SESSION'), 'Used by HTTP/2 sessions');
	assert.equal(tracker.getTypeDescription('HTTP2STREAM'), 'Used by HTTP/2 streams');
	assert.equal(tracker.getTypeDescription('ZLIB'), 'Used by Zlib');
	assert.equal(tracker.getTypeDescription('TTYWRAP'), 'Used by TTY handles');
	assert.equal(tracker.getTypeDescription('UDPSENDWRAP'), 'Used by UDP sockets');
	assert.equal(tracker.getTypeDescription('UDPWRAP'), 'Used by UDP sockets');
	assert.equal(tracker.getTypeDescription('WRITEWRAP'), 'Used by process.stdout and process.stderr');
	assert.equal(tracker.getTypeDescription('SHUTDOWNWRAP'), 'Used by socket.end()');
	active = tracker.report();
	assert.equal(active, 0)
});
test('addCustomType', () => {
	// Case insensitive
	// new type
	tracker.addCustomType('CuStOMPROMISe', 'Custom promise type')
	assert.equal(tracker.getTypeDescription('CUSTOMPROMISE'), 'Custom promise type');
	// Overwrite
	tracker.addCustomType('SCRIPT', 'vm context')
	assert.equal(tracker.getTypeDescription('script'), 'vm context');
	active = tracker.report();
	assert.equal(active, 0)
});

test('enable - filter', () => {
	try {
		tracker.enable('INVALID_TYPE');
		assert.unreachable('should have thrown, Unknown type');
	} catch (err) {
		assert.match(err.message, 'Unknown type: INVALID_TYPE');
	}
	tracker.enable('PROMISE');
	// A new promise
	let externalResolve; // to resolve a promise from the outside
	const p = new Promise((resolve, reject) => {
		externalResolve = resolve
	});
	active = tracker.report();
	assert.equal(active, 1);
	let trackerRes = tracker.getUnresolved('promise');
	assert.equal(trackerRes.length, 1);
	assert.equal(trackerRes[0].type, 'PROMISE');
	// // Resolve the outstanding Promise
	externalResolve();
	active = tracker.report();
	assert.equal(active, 0);
	tracker.disable();
});

test('enable : filter does not register a Promise', () => {
	tracker.enable('SCRIPT');
	// A new promise
	let externalResolve; // to resolve a promise from the outside
	const p = new Promise((resolve, reject) => {
		externalResolve = resolve
	});
	active = tracker.report();
	assert.equal(active, 0);
	// still resolve the unregistered but unresolved promise
	externalResolve();
	tracker.disable();
});

test('enable : register all', () => {
	tracker.enable();
	// A new promise
	let externalResolve; // to resolve a promise from the outside
	const p = new Promise((resolve, reject) => {
		externalResolve = resolve
	});
	setTimeout(() => {
		// tracker.report(true);
	}, 500)
	active = tracker.report();
	assert.equal(active, 2);
	assert.equal(tracker.getUnresolved('TIMEOUT').length, 1);
	assert.equal(tracker.getUnresolved('PROMISE').length, 1);
	assert.equal(tracker.getUnresolved().length, 2);
	// Resolve the outstanding promise
	externalResolve();
	tracker.disable();
});
test.run();
