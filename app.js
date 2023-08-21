// Importing required modules
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

// Creating an instance of Express app
const app = express();

// Setting the view engine to EJS
app.set("view engine", "ejs");

// Adding middleware to handle URL-encoded form data and static files
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Connecting to MongoDB
mongoose
  .connect(
    "mongodb+srv://admin-Rahil:rahil123@cluster0.eezfufr.mongodb.net/todolistDB",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true, // Using the new unified topology engine
    }
  )
  .then(() => {
    console.log("Connected to MongoDB.");
    app.listen(4000, function () {
      console.log("Server started on port 4000");
    });
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB:", err);
  });

// Defining the schema for individual to-do list items
const itemsSchema = {
  name: String,
};

// Creating a model based on the items schema
const Item = mongoose.model("Item", itemsSchema);

// Creating default to-do list items
const item1 = new Item({
  name: "Welcome to your todolist!",
});
const item2 = new Item({
  name: "Hit the + button to add a new item.",
});
const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

// Storing default items in an array
const defaultItems = [item1, item2, item3];

// Defining the schema for custom lists
const listSchema = {
  name: String,
  items: [itemsSchema],
};

// Creating a model based on the lists schema
const List = mongoose.model("List", listSchema);

let defaultItemsPresented = false; // Flag to track if default items have been presented

app.get("/", function (req, res) {
  // Finding all items in the Items collection
  Item.find({}, function (err, foundItems) {
    if (err) {
      console.log(err);
    } else {
      if (!defaultItemsPresented && foundItems.length === 0) {
        // Inserting the default items into the database
        Item.insertMany(defaultItems, function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully saved default items to DB.");
            defaultItemsPresented = true; // Marking default items as presented
            // Rendering the list template with the default items
            res.render("list", {
              listTitle: "Today",
              newListItems: defaultItems,
            });
          }
        });
      } else {
        // Rendering the list template with found items
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    }
  });
});

// Handling custom list routes
app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  // Finding a list with the provided custom list name
  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        // If no list is found, creating a new list with default items
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        // Rendering the list template with items from the found list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

// Handling POST requests for adding items
app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  // Creating a new item based on the provided name
  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    // If it's the default list, saving the item and redirecting to the root route
    item.save();
    res.redirect("/");
  } else {
    // If it's a custom list, finding the list and adding the item to it
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

// Handling POST requests for deleting items
app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    // If it's the default list, deleting the item by its ID
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    // If it's a custom list, finding the list and pulling the item from it by its ID
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

// Handling the "about" page route
app.get("/about", function (req, res) {
  res.render("about");
});

// Starting the server on port 3000
app.listen(3000, function () {
  console.log("Server started on port 3000");
});
