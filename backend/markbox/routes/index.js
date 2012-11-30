// MongoDB connection

if(process.env.VCAP_SERVICES){
  var env = JSON.parse(process.env.VCAP_SERVICES);
  var mongo = env['mongodb-1.8'][0]['credentials'];
}
else{
  var mongo = {
    "hostname":"localhost",
    "port":27017,
    "username":"",
    "password":"",
    "name":"",
    "db":"db"
  }
}
var generate_mongo_url = function(obj){
  obj.hostname = (obj.hostname || 'localhost');
  obj.port = (obj.port || 27017);
  obj.db = (obj.db || 'test');
  if(obj.username && obj.password){
    return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
  }
  else{
    return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db;
  }
}

var mongourl = generate_mongo_url(mongo);
var revision_id = 0;

/*
 * GET home page.
 */

 var db = require('mongodb'),
 request = require('request'),
 ObjectID = db.ObjectID;


 function requireLogin(req, res){
  if(!req.session.authenticated){
    res.json({ success: false, error: "Authentication required."});
    return false;
  }

  return true;
}

exports.index = function(req, res){
  res.render('index', { title: 'markBox' });
};

exports.fb_success = function(req, res){
  res.render('index', { title: 'markBox' });
};

exports.login = function(req, res){
  console.log(req.body);
  if(!req.body.access_token)
    return res.json({ success: false, error: "Missing fields"});

  request('https://graph.facebook.com/me?access_token=' + req.body.access_token, function(error, response, body){
    if(error)
      return res.json({ success: false, error: "Authentication failed", debug: error});

    var res_data = JSON.parse(body);

    if(!res_data.id)
      return res.json({ success: false, error: "Authentication failed", debug: res_data});

    req.session.access_token = req.body.access_token;
    req.session.user_id = res_data.id;
    req.session.authenticated = true;

    return res.json({ success: true, debug: res_data });
  });
}

exports.add_bookmark = function(req, res){
  if(!requireLogin(req, res)) return;

  if(!req.body.url || !req.body.group_id || !req.body.title)
    return res.json({ success: false, error: "Missing fields"});

  db.connect(mongourl, function(err, conn){
    if(err)
      return res.json({ success: false, error: err });

    conn.collection('bookmarks', function(err, coll){
      if(err)
        return res.json({ success: false, error: err });

      var bookmark = {
        url: req.body.url,
        title: req.body.title,
        group_id: req.body.group_id,
        owner: req.session.user_id
      };

      coll.insert(bookmark, {safe: true}, function(err){
        if(err)
          return res.json({ success: false, error: "Server database error"});

        revision_id++;

        conn.close();
        return res.json({ success: true });
      });

    });
  });
}

exports.delete_bookmark = function(req, res){
  if(!requireLogin(req, res)) return;

  if(!req.body.id)
    return res.json({ success: false, error: "Missing fields"});

  db.connect(mongourl, function(err, conn){
    if(err)
      return res.json({ success: false, error: err });

    conn.collection('bookmarks', function(err, coll){
      if(err)
        return res.json({ success: false, error: err });

      coll.findOne({_id: new ObjectID(req.body.id)}, function(err, doc){
        if(err)
          return res.json({ success: false, error: err });

        if(req.session.user_id != doc.owner)
          return res.json({ success: false, error: "Access denied: User is not owner of bookmark"} );

        coll.remove({_id: new ObjectID(req.body.id)}, function(err, doc){
          if(err)
            return res.json({ success: false, error: err });

          revision_id++;
          conn.close();

          return res.json({ success: true });
        });
      });
    });
  });
}

exports.user_links = function(req, res){
  if(!requireLogin(req, res)) return;

  if(!req.body.groups)
    return res.json({ success: false, error: "Missing fields"});

  request('https://graph.facebook.com/me/groups?access_token=' + req.session.access_token, function(error, response, body){
    if(error) 
      return res.json({ success: false, error: "Authentication failed, login again"});

    var res_data = JSON.parse(body);

    if(!res_data.data)
      return res.json({ success: false, error: "Authentication failed, login again"});

    res_data = res_data.data;

    var groups = {}, group_ids = [];
    for(var i = 0; i < res_data.length; i++){
      group_ids.push(res_data[i].id);
      groups[res_data[i].id] = res_data[i];
    }

    var bookmarks_by_group = {};

    db.connect(mongourl, function(err, conn){
      if(err)
        return res.json({ success: false, error: err, message: "Error while connecting to MongoDB" });

      conn.collection('bookmarks', function(err, coll){
        if(err)
          return res.json({ success: false, error: err, message: "Error while selecting connection"  });

        var cursor = coll.find({group_id:{$in: req.body.groups}});

        cursor.toArray(function(err, items){
          if(err)
            return res.json({ success: false, error: items, message: "Error while finding bookmarks"  });

          if(!items) 
            return res.json({ success: false });

          for(var i = 0; i < items.length; i++){
            var item = items[i];

            if(!groups[item.group_id])
              continue;

            if(!bookmarks_by_group[item.group_id]){
              bookmarks_by_group[item.group_id] = {
                group_id: item.group_id,
                group_name: groups[item.group_id].name,
                bookmarks: [item]
              }

            } else {
              bookmarks_by_group[item.group_id].bookmarks.push(item);
            }
          }

          output = {};
          output['bookmarks'] = [];
          console.log(bookmarks_by_group);
          for(var group in bookmarks_by_group){
            var cgroup = {
              title: bookmarks_by_group[group].group_name,
              children: []
            }

            for(var i = 0; i < bookmarks_by_group[group].bookmarks.length; i++){
              var cbook = bookmarks_by_group[group].bookmarks[i];
              var cbook_tree = {
                title: cbook.title,
                url: cbook.url
              }

              cgroup.children.push(cbook_tree);
            }

            output['bookmarks'].push(cgroup);
          }

          output['success'] = true;
          output['revision_id'] = revision_id;

          conn.close();

          res.json(output);

        });
      });
    });
  });

}


exports.user_linklist = function(req, res){
  if(!requireLogin(req, res)) return;

  if(!req.body.groups)
    return res.json({ success: false, error: "Missing fields"});

  request('https://graph.facebook.com/me/groups?access_token=' + req.session.access_token, function(error, response, body){
    if(error) 
      return res.json({ success: false, error: "Authentication failed, login again"});

    var res_data = JSON.parse(body);

    if(!res_data.data)
      return res.json({ success: false, error: "Authentication failed, login again"});

    res_data = res_data.data;

    var groups = {}, group_ids = [];
    for(var i = 0; i < res_data.length; i++){
      group_ids.push(res_data[i].id);
      groups[res_data[i].id] = res_data[i];
    }

    var bookmarks_by_group = {};

    db.connect(mongourl, function(err, conn){
      if(err)
        return res.json({ success: false, error: err, message: "Error while connecting to MongoDB" });

      conn.collection('bookmarks', function(err, coll){
        if(err)
          return res.json({ success: false, error: err, message: "Error while selecting connection"  });

        var cursor = coll.find({group_id:{$in: req.body.groups}});

        cursor.toArray(function(err, items){
          if(err)
            return res.json({ success: false, error: err, message: "Error while finding bookmarks"  });

          if(!items) 
            return res.json({ success: false });

          for(var i = 0; i < items.length; i++){
            var item = items[i];

            if(!groups[item.group_id])
              continue;

            if(!bookmarks_by_group[item.group_id]){
              bookmarks_by_group[item.group_id] = {
                group_id: item.group_id,
                group_name: groups[item.group_id].name,
                bookmarks: [item]
              }

            } else {
              bookmarks_by_group[item.group_id].bookmarks.push(item);
            }
          }

          output = {};
          output['bookmarks'] = [];
          console.log(bookmarks_by_group);
          for(var group in bookmarks_by_group){
            var cgroup = {
              title: bookmarks_by_group[group].group_name,
              id: group,
              children: []
            }

            for(var i = 0; i < bookmarks_by_group[group].bookmarks.length; i++){
              var cbook = bookmarks_by_group[group].bookmarks[i];
              var cbook_tree = {
                title: cbook.title,
                url: cbook.url,
                owner: cbook.owner
              }

              cgroup.children.push(cbook_tree);
            }

            output['bookmarks'].push(cgroup);
          }

          output['success'] = true;
          output['revision_id'] = revision_id;

          conn.close();

          res.json(output);

        });
      });
    });
  });

}

exports.user_sync = function(req, res){
  if(!requireLogin(req, res)) return;

  request('https://graph.facebook.com/me/groups?access_token=' + req.session.access_token, function(error, response, body){
    if(error) 
      return res.json({ success: false, error: "Authentication failed, login again"});

    var res_data = JSON.parse(body);

    if(!res_data.data)
      return res.json({ success: false, error: "Authentication failed, login again"});

    res_data = res_data.data;

    var groups = {}, group_ids = [];
    for(var i = 0; i < res_data.length; i++){
      group_ids.push(res_data[i].id);
      groups[res_data[i].id] = res_data[i];
    }

    var output = {};

    db.connect(mongourl, function(err, conn){
      if(err)
        return res.json({ success: false, error: err });

      conn.collection('bookmarks', function(err, coll){
        if(err)
          return res.json({ success: false, error: err });

        var cursor = coll.find({group_id:{$in: group_ids}});
        console.log(JSON.stringify( {group_id:{$in: group_ids}} ));

        cursor.toArray(function(err, items){
          if(err)
            return res.json({ success: false, error: err });

          if(!items) 
            return res.json({ success: false });

          for(var i = 0; i < items.length; i++){
            var item = items[i];


            if(!output[item.group_id]){
              output[item.group_id] = {
                group_id: item.group_id,
                group_name: groups[item.group_id].name,
                bookmarks: [item]
              }

            } else {
              output[item.group_id].bookmarks.push(item);
            }
          }

          conn.close();

          res.json(output);

        });
      });
    });
  });
}