/* global describe, it */

const FSMonitor = require('./');
const expect = require('chai').expect;
const fs = require('fs');

const originalFS = Object.assign({}, fs);

describe('FSMonitor', function() {
  it('will only allow one active instance at a time', function() {
    let monitor0 = new FSMonitor();
    let monitor1 = new FSMonitor();

    monitor0.start();
    monitor1.start();

    expect(monitor0.state, 'monitor0 (m0 active)').to.eql('active');
    expect(monitor1.state, 'monitor1 (m0 active)').to.eql('idle');

    monitor0.stop();

    monitor1.start();
    monitor0.start();

    expect(monitor0.state, 'monitor0 (m1 active)').to.eql('idle');
    expect(monitor1.state, 'monitor1 (m1 active)').to.eql('active');

    monitor1.stop();
    monitor0.stop();
  });

  it('does not mutate the prototype of classes on fs [GH#22]', function() {
    let monitor = new FSMonitor();

    expect(typeof fs.Stats.prototype.isFile).to.equal('function');

    monitor.start();

    expect(typeof fs.Stats.prototype.isFile).to.equal('function', 'after updating fs');

    monitor.stop();

    expect(typeof fs.Stats.prototype.isFile).to.equal('function');
  });

  it('avoids mutating known classes on `fs` [GH#22]', function() {
    let monitor = new FSMonitor();

    expect(fs.Stats.prototype.isFile).to.be;
    expect(fs.Stats).to.equal(originalFS.Stats);
    expect(fs.Dirent).to.equal(originalFS.Dirent);
    expect(fs.FSWatcher).to.equal(originalFS.FSWatcher);
    expect(fs.FileHandle).to.equal(originalFS.FileHandle);
    expect(fs.ReadStream).to.equal(originalFS.ReadStream);
    expect(fs.WriteStream).to.equal(originalFS.WriteStream);

    try {
      monitor.start();

      // should not have been changed
      expect(fs.Stats).to.equal(originalFS.Stats);
      expect(fs.Dirent).to.equal(originalFS.Dirent);
      expect(fs.FSWatcher).to.equal(originalFS.FSWatcher);
      expect(fs.FileHandle).to.equal(originalFS.FileHandle);
      expect(fs.ReadStream).to.equal(originalFS.ReadStream);
      expect(fs.WriteStream).to.equal(originalFS.WriteStream);
    } finally {
      // ensure we stop and detach even if we fail an assertion
      monitor.stop();
    }

    expect(fs.Stats).to.equal(originalFS.Stats);
    expect(fs.Dirent).to.equal(originalFS.Dirent);
    expect(fs.FSWatcher).to.equal(originalFS.FSWatcher);
    expect(fs.FileHandle).to.equal(originalFS.FileHandle);
    expect(fs.ReadStream).to.equal(originalFS.ReadStream);
    expect(fs.WriteStream).to.equal(originalFS.WriteStream);
  });

  describe('.prototype.stop', function() {
    it('restores fs functions to their defaults', function() {
      let monitor = new FSMonitor();

      expect(fs.statSync).to.equal(originalFS.statSync);

      monitor.start();
      expect(fs.statSync).to.not.equal(originalFS.statSync);

      monitor.stop();
      expect(fs.statSync).to.equal(originalFS.statSync);
    });
  });
});
