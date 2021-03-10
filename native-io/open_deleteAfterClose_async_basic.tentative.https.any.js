// META: title=NativeIO API: Temporary files are deleted on closure
// META: global=window,worker
// META: script=resources/support.js

'use strict';

promise_test(async testCase => {
  await reserveAndCleanupCapacity(testCase);

  const temporaryFile =
      await storageFoundation.open('test_file', {deleteAfterClose: true});

  const writeSharedArrayBuffer = new SharedArrayBuffer(4);
  const writtenBytes = new Uint8Array(writeSharedArrayBuffer);
  writtenBytes.set([64, 65, 66, 67]);
  const writeCount = await temporaryFile.write(writtenBytes, 0);
  assert_equals(
      writeCount, 4,
      'NativeIOFile.write() should resolve with the number of bytes written');

  await promise_rejects_dom(
      testCase, 'NoModificationAllowedError', storageFoundation.open('test_file'),
      'storageFoundation.open fails when the file is already open with the ' +
        'deleteAfterClose flag');
  await temporaryFile.close();

  const persistentFile =
      await storageFoundation.open('test_file', {deleteAfterClose: false});
  testCase.add_cleanup(async () => {
    await persistentFile.close();
    await storageFoundation.delete('test_file');
  });

  const readSharedArrayBuffer = new SharedArrayBuffer(writtenBytes.length);
  const readBytes = new Uint8Array(readSharedArrayBuffer);
  const readCount = await persistentFile.read(readBytes, 0);
  assert_equals(readCount, 0, 'NativeIOFile.read() should return 0 bytes read');
}, 'Storage Foundation file created with deleteAfterClose flag is deleted on ' +
     'closure');

promise_test(async testCase => {
  await reserveAndCleanupCapacity(testCase);

  const persistentFile =
      await storageFoundation.open('test_file', {deleteAfterClose: false});

  const writeSharedArrayBuffer = new SharedArrayBuffer(4);
  const writtenBytes = new Uint8Array(writeSharedArrayBuffer);
  writtenBytes.set([64, 65, 66, 67]);
  const writeCount = await persistentFile.write(writtenBytes, 0);
  assert_equals(
      writeCount, 4,
      'NativeIOFile.write() should resolve with the number of bytes written');
  await persistentFile.close();

  const temporaryFile =
      await storageFoundation.open('test_file', {deleteAfterClose: true});

  var readSharedArrayBuffer = new SharedArrayBuffer(writtenBytes.length);
  var readBytes = new Uint8Array(readSharedArrayBuffer);
  var readCount = await temporaryFile.read(readBytes, 0);
  assert_equals(readCount, 4,
                'NativeIOFile.read() should return the number of bytes read');

  assert_array_equals(readBytes, writtenBytes,
                      'the bytes read should match the bytes written');

  await temporaryFile.close();

  const emptyFile =
      await storageFoundation.open('test_file', {deleteAfterClose: false});
  testCase.add_cleanup(async () => {
    await emptyFile.close();
    await storageFoundation.delete('test_file');
  });

  readSharedArrayBuffer = new SharedArrayBuffer(writtenBytes.length);
  readBytes = new Uint8Array(readSharedArrayBuffer);
  readCount = await emptyFile.read(readBytes, 0);
  assert_equals(readCount, 0, 'NativeIOFile.read() should return 0 bytes read');
}, 'An existing Storage Foundation file opened with deleteAfterClose flag is ' +
     'deleted on closure');
