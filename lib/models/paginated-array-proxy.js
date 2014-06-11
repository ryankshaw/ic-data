import { ArrayProxy, RSVP, String } from 'ember';

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
    debugger
    return RSVP.all(this.types.map(fn.bind(this)));
  },

  content:function(){
    if(this.get('folders.isFulfilled') && this.get('files.isFulfilled')){
      return this.get('folders').toArray().concat(this.get('files').toArray())
    }
    return [];
  }.property('folders.[]', 'files.[]'),

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
    return this.getNextPage.then(this.loadAll)
  },

  areAllLoaded: function(type){
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

    // TODO: It would be better to do this in a way that doesn't assume we
    // need to have 'include[]=user' and keeps other query string params around
    var queryParams = '?include[]=user&sort=' + column + '&order=' + (this.get('sortAscending') ? 'asc' : 'desc');
    var folder = this.get('folder');

    var res =  this.iterate(function(type){
      if (this.areAllLoaded(type)) return;
      url = new URL(folder.get('data.links.' + type));
      url.search = queryParams;
      folder.set('data.links.' + type, url.toString());
      folder._relationships[type] = null;
      folder.notifyPropertyChange(type);
      return folder.get(type);
    });
    debugger
    this.loadAll();
    return res;

  }

});


export default PaginatedArrayProxy;