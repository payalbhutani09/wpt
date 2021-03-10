// META: title=Synchronous NativeIO API: Temporary files are deleted on closure
// META: global=dedicatedworker
// META: script=resources/support.js

'use strict';

test(testCase => {
  reserveAndCleanupCapacitySync(testCase);

  const temporaryFile =
     storageFoundation.openSync('test_file', {deleteAfterClose: true});

  const writeSharedArrayBuffer = new SharedArrayBuffer(4);
  const writtenBytes = new Uint8Array(writeSharedArrayBuffer);
  writtenBytes.set([64, 65, 66, 67]);
  const writeCount = temporaryFile.write(writtenBytes, 0);
  assert_equals(
      writeCount, 4,
      'NativeIOFileSync.write() should resolve with the number of bytes ' +
        'written');

  assert_throws_dom(
      'NoModificationAllowedError',
      () => storageFoundation.openSync('test_file'),
      'storageFoundation.openSync fails when the file is already open with ' +
        'the deleteAfterClose flag');
  temporaryFile.close();

  const persistentFile =
      storageFoundation.openSync('test_file', {deleteAfterClose: false});
  testCase.add_cleanup(() => {
    persistentFile.close();
    storageFoundation.deleteSync('test_file');
  });

  const readSharedArrayBuffer = new SharedArrayBuffer(writtenBytes.length);
  const readBytes = new Uint8Array(readSharedArrayBuffer);
  const readCount = persistentFile.read(readBytes, 0);
  assert_equals(readCount, 0, 'NativeIOFileSync.read() should return 0 bytes ' +
                                'read');
}, 'Storage Foundation file created with deleteAfterClose flag is deleted on ' +
     'closure');

test(testCase => {
  reserveAndCleanupCapacitySync(testCase);

  const persistentFile =
      storageFoundation.openSync('test_file', {deleteAfterClose: false});

  const writeSharedArrayBuffer = new SharedArrayBuffer(4);
  const writtenBytes = new Uint8Array(writeSharedArrayBuffer);
  writtenBytes.set([64, 65, 66, 67]);
  const writeCount = persistentFile.write(writtenBytes, 0);
  assert_equals(
      writeCount, 4,
      'NativeIOFileSync.write() should resolve with the number of bytes ' +
        'written');
  persistentFile.close();

  const temporaryFile =
      storageFoundation.openSync('test_file', {deleteAfterClose: true});

  var readSharedArrayBuffer = new SharedArrayBuffer(writtenBytes.length);
  var readBytes = new Uint8Array(readSharedArrayBuffer);
  var readCount = temporaryFile.read(readBytes, 0);
  assert_equals(readCount, 4,
                'NativeIOFileSync.read() should return the number of bytes ' +
                  'read');

  assert_array_equals(readBytes, writtenBytes,
                      'the bytes read should match the bytes written');

  temporaryFile.close();

  const emptyFile =
      storageFoundation.openSync('test_file', {deleteAfterClose: false});
  testCase.add_cleanup(() => {
    emptyFile.close();
    storageFoundation.deleteSync('test_file');
  });

  readSharedArrayBuffer = new SharedArrayBuffer(writtenBytes.length);
  readBytes = new Uint8Array(readSharedArrayBuffer);
  readCount = emptyFile.read(readBytes, 0);
  assert_equals(readCount, 0, 'NativeIOFileSync.read() should return 0 bytes ' +
                                'read');
}, 'An existing Storage Foundation file opened with deleteAfterClose flag is ' +
     'deleted on closure');
