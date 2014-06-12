import { ArrayProxy, RSVP } from 'ember';

var PaginatedArrayProxy = ArrayProxy.extend({

  files: Ember.computed.alias('folder.files'),
  folders: Ember.computed.alias('folder.folders'),
  files_count: Ember.computed.alias('folder.files_count'),
  folders_count: Ember.computed.alias('folder.folders_count'),
  sortParam: 'name',
  sortAscending: true,
  folder: null,

  types: ['folders', 'files'],

  // runs `fn` for each type in `this.types`
  // `this` inside the callback will be the paginatedArrayProxy
  iterate: function(fn){
    return RSVP.all(this.types.map(fn.bind(this)));
  },

  content:function(){
    // if (this.get('folders.isFulfilled') && this.get('files.isFulfilled')){
    if (!this.folder._relationships.folders && !this.folder._relationships.files) return [];

    return this.get('folders').toArray().concat(this.get('files').toArray());
  }
  // from http://emberjs.com/api/classes/Ember.ArrayController.html#property__
  // If you merely want to watch for any items being added or removed to the array, use the [] property instead of @each.
  .property('folder.folders.[]', 'folder.files.[]'),

  getNextPage: function(){
    return this.iterate(function(type){
      if (!this.areAllLoaded(type)) {
        return this.get(type).then(function(childAssociation){
          return childAssociation.getNextPage();
        });
      }
    });
  },

  loadAll: function(){
    if (this.areAllLoaded('files') && this.areAllLoaded('folders')) return
    return this.getNextPage().then(this.loadAll.bind(this))
  },

  areAllLoaded: function(type){
    // return false without triggering ajax if nothing loaded so far
    if (!this.get('folder._relationships')[type]) return false;
    return this.get(type + '.length') == this.get(type +'_count');
  },

  // tells me to sort by the given column name, sortAscending is optional
  setSort: function(column, sortAscending){
    if (sortAscending == null) {
      sortAscending = this.get('sortParam') !== column;
    }
    this.setProperties({
      sortParam: column,
      sortAscending: !!sortAscending
    });
  },

  setQueryStringParams: function(){
    // TODO: It would be better to do this in a way that doesn't assume we
    // need to have 'include[]=user' and keeps other query string params around
    var queryParams = '?include[]=user&per_page=20&sort=' + this.get('sortParam') + '&order=' + (this.get('sortAscending') ? 'asc' : 'desc');
    var folder = this.get('folder');

    var res = this.iterate(function(type){
      if (this.areAllLoaded(type)) return;
      var url = new URL(folder.get('data.links.' + type));
      url.search = queryParams;
      folder.set('data.links.' + type, url.toString());
      if (folder._relationships[type]) {
        folder._relationships[type] = null;
      }
      folder.notifyPropertyChange(type);
      return folder.get(type);
    });
    this.loadAll();
    return res;
  }.on('init').observes('sortParam', 'sortAscending')

});


export default PaginatedArrayProxy;