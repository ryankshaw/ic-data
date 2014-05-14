moduleForModel('module', 'Module', {
  needs: [
    'serializer:module',
    'adapter:module'
  ]
});

test('create and delete a module', function() {
  expect(3);
  var store = this.store();
  var model = this.subject({
    name: 'test module',
    courseId: ENV.courseId
  });
  stop();
  Ember.run(function() {
    model.save().then(function(result) {
      start();
      ok(result.get('id'), 'got an id');
      equal(result, model);
      stop();
      Ember.run(function() {
        result.destroyRecord().then(function() {
          start();
          ok(true);
        });
      });
    });
  });
});

test('finds all modules for a course', function() {
  expect(1);
  var store = this.store();
  stop();
  store.findQuery('module', {
    courseId: ENV.courseId,
    per_page: 2
  }).then(function(modules) {
    start();
    ok(modules, 'got modules');
  });
});


test('pagination for module works', function() {
  expect(2);
  var store = this.store();
  stop();
  store.findQuery('module', {
    courseId: ENV.courseId,
    per_page: 2
  }).then(function(modules) {
    start();
    equal(modules.get('length'),2, 'first page has 2 modules');
    stop();
    var nextUrl = modules.get('meta.next');
    return store.findQuery('module', {
      url: nextUrl
    });
  }).then(function(newModules){
    start();
    equal(newModules.get('length'), 1, 'first page has 1 module');
  });
});
