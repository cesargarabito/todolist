//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");

const mongoose = require("mongoose");
const _ = require('lodash');

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
});

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your to do list!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};
//a new schema, for any new list that we create, that list is gonna have the key values above, asociated with that we need a mongoose model

const List = mongoose.model('List', listSchema);


app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) { //finds all elements to return an array
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems }); 
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  if (listName === 'Today'){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save(function(){
        res.redirect('/' + listName);
      });
      
    });
  }

  
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox.trim();
  const listName = req.body.listName;

  if (listName === 'Today'){
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        console.log("success");
        res.redirect("/");
  }
});
    } else {
      List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
        if(!err){
          res.redirect('/' + listName);
        }
      });
    }
  
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){ //In this case we only need to return an object, meaning one doc
if (!err){
  if(!foundList){
    //Create new list
    const list = new List({
      name: customListName,
      items: defaultItems
    });
  list.save();
  res.redirect('/' + customListName);
  }else {
    //Show an existing list
    res.render("list", { listTitle: foundList.name, newListItems: foundList.items }); 
  }
}
  });

  
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
