var ObjectId = require('mongodb').ObjectId
module.exports = function(app, passport, db) {

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    // PROFILE SECTION =========================
    app.get('/orders', isLoggedIn, function(req, res) {
        db.collection('orders').find().toArray((err, result) => {
          if (err) return console.log(err)
          console.log(JSON.stringify(req.user))
          res.render('orders.ejs', {
            user : req.user,
            orders: result
          })
        })
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

// message board routes ===============================================================
    app.post('/orders', (req, res) => {
      db.collection('orders').save({order: req.body.order, name: req.body.customerName, complete: false}, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/orders')
      })
    })
    app.post('/completeorder', (req, res) => {
      console.log('complete:' + req.body.user)
        db.collection('orders').findOneAndUpdate({_id: new ObjectId(req.body.mongoid)}, {
          $set: {
            complete: true,
            barista: req.body.user
          }
        }, {
          sort: {_id: -1},
          upsert: false
        }, (err, result) =>{
          res.redirect('/orders')
        }
        )
      
      // db.collection('orders').findOneAndUpdate({order: req.body.order, name: req.body.customerName, complete: false}, (err, result) => {
      //   if (err) return console.log(err)
      //   console.log('saved to database')
      //   res.redirect('/orders')
      // })
    })

    app.put('/orders', (req, res) => {
      db.collection('orders')
      .findOneAndUpdate({name: req.body.name, msg: req.body.msg}, {
        $set: {
          thumbUp:req.body.thumbUp + 1
        }
      }, {
        sort: {_id: -1},
        upsert: true
      }, (err, result) => {
        if (err) return res.send(err)
        res.send(result)
      })
    })

    app.delete('/orders', (req, res) => {
      db.collection('orders').findOneAndDelete({name: req.body.name, msg: req.body.msg}, (err, result) => {
        if (err) return res.send(500, err)
        res.send('Order Completed!')
      })
    })

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/orders', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/orders', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/orders');
        });
    });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
