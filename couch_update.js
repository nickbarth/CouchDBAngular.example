var request = require('request'),
    couch_url = 'http://localhost:5984/lego-news/',
    design_doc = {
      _id: '_design/news',
      language: 'javascript',
    };

design_doc.views = {
  all_news: ['map', function (doc) {
    if (doc.type !== 'Photo') return;

    emit(doc.id, doc);
  }]
};

design_doc.validate_doc_update = function (newDoc, oldDoc, userCtx) {
  if (!userCtx.name)
    throw({'unauthorized': 'You must be logged in to create a new post.'});

  if (newDoc._deleted !== true && newDoc.type === 'Photo' && newDoc.title.trim().length < 5)
    throw('forbidden', 'You must enter a title longer than 5 characters.');
};

Object.keys(design_doc.views).forEach(function  (key) {
  var view = design_doc.views[key],
      obj = {};

  obj[view[0]] = view[1].toString();
  design_doc.views[key] = obj;
});

design_doc.validate_doc_update = design_doc.validate_doc_update.toString();

// console.log(JSON.stringify(design_doc));

request.get(couch_url + design_doc.id, function (err, code, body) {
  console.log(body);
});
