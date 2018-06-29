const express = require('express');
const menusRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const menuItemsRouter = require('./menu-items.js');
menusRouter.use('/:menuId/menu-items', menuItemsRouter);

//Establishing Parameter
menusRouter.param('menuId', (req, res, next, menuId) => {
  const sql = 'SELECT * FROM Menu WHERE Menu.id = $menuId';
  const values = {$menuId: menuId};
  db.get(sql, values, (error, menu) => {
    if (error) {
      next(error);
    } else if (menu) {
      req.menu = menu;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

// /menus GET
menusRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Menu', (error, menus) => {
    if (error) {
      next(error);
    } else {
      res.send({menus: menus});
    };
  });
})

// /menus/:menuId GET
menusRouter.get('/:menuId', (req, res, next) => {
  res.status(200).json({menu: req.menu});
});

// /menus POST
menusRouter.post('/', (req, res, next) => {
  const title = req.body.menu.title;
  if (!title) {
    return res.sendStatus(400);
  }

  const sql = 'INSERT INTO Menu (title) VALUES ($title)';
  const values = {
    $title: title
  };

  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Menu WHERE Menu.id = ${this.lastID}`,
        (error, menu) => {
          res.status(201).json({menu: menu});
        });
    }
  });
});

// /menus/:menuId PUT
menusRouter.put('/:menuId', (req, res, next) => {
  const title = req.body.menu.title;

  if (!title) {
    return res.status(400).send();
  };

  db.run(`UPDATE Menu
          SET title = $title
          WHERE id = $id`, {
            $title: title,
            $id: req.params.menuId
          }, function(error) {
            if(error) {
              next(error);
            };
            db.get('SELECT * FROM Menu WHERE id = $id', {
              $id: req.params.menuId
            }, (error, menu) => {
              if (error) {
                next(error);
              } else {
                res.send({menu: menu});
              };
            });
          });
})

// /menus/:menuId DELETE
menusRouter.delete('/:menuId', (req, res, next) => {
  db.get('SELECT * FROM MenuItem WHERE menu_id = $id', {$id: req.params.menuId}, (error, MenuItem) => {
    if (error) {
      next(error);
    } else if (MenuItem) {
      res.status(400).send();
    } else {
      db.run(`DELETE FROM Menu WHERE id = $id`, {$id: req.params.menuId}, error => {
        if (error) {
          next(error);
        } else {
          res.status(204).send();
        };
      });
    };
  });

})

module.exports = menusRouter;
