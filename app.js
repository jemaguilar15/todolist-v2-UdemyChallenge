//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

// mongoose.connect("mongodb://localhost:27017/todolistDB", { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
// mongoose.connect("mongodb+srv://admin-john:test@cluster0-qrkv6.mongodb.net/todolistDB", { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

mongoose.connect("mongodb+srv://" + process.env.DB_UID + ":" + process.env.DB_PWD + "@cluster0-qrkv6.mongodb.net/todolistDB", { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

// mongoose.connect("mongodb+srv://admin-john:1234@cluster0-qrkv6.mongodb.net/todolistDB?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
// 

// Schema
const itemSchema = new mongoose.Schema({
  name: String
})

const listSchema = {
  name: String,
  items: [itemSchema] // items variable will be using itemSchema
}

// Model name
const Item = mongoose.model("Item", itemSchema);
const List = mongoose.model("List", listSchema);

// Create new items
const pray = new Item({
  name: "Pray"
  // content: "Giving thanks to our Lord Jesus Christ"
});

const readBible = new Item({
  name: "Read your bible"
  // content: "Read Our Daily Bread yr. 2020 edition"
});

const drinkCofee = new Item({
  name: "Brew your best coffee"
  // content: "Energize, Go John!"
});

const defaultItems = [pray, readBible, drinkCofee];

// |----------------------------------
// |Item.insertMany(defaultItems, (err) => {
// | if(err) {
// |    console.log(err);
// | } else {
// |   console.log("Default todolist has been inserted.");
// | }
// | });
// |----------------------------------

// Get routes
app.get("/", function(req, res) {

  Item.find({}, (err, foundItems) => {
    if(foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if(err) {
              console.log(err);
          } else {
            console.log("Default todolist has been inserted.");
          }
       });
       res.redirect("/");
    } else {
      // render at list.ejs, render { list title } & { new list items from found items find on collections}
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  })
});

// Custome List name
app.get("/:uri", function(req, res) {
  const customListName = _.capitalize(req.params.uri);

  // Adventure.findOne({ type: 'iphone' }, function (err, adventure) {});
  List.findOne({name: customListName}, function(err, list) {
    if(!err) {

      if(!list) {
        // Create new list 
        const list = new List({
          name: customListName,
          items: defaultItems
        });
      
        list.save();
        res.redirect("/" + customListName);        
      } else {

        // render he list.ejs, display { list title from lists collections, new list item from }
        res.render("list", {listTitle: list.name, newListItems: list.items});
        
      }
    }
  });

});

app.get("/about", function(req, res){
  res.render("about");
});

// |----------------------------------------
// |            POST ROUTES 
// |----------------------------------------
app.post("/", function(req, res){

  const itemName = req.body.newItem; // -> on list.ejs, from user input
  const listName = req.body.list; // -> on list.ejs, from listTitle of button value
 
  const newItem = new Item({
    name: itemName
  })

  if(listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
// Access the LISTS COLLECTION, findOne or look in the collection name = user input (itemName)
// listItem = result from the query
    List.findOne({name: listName}, function(err, listItem) {
      // listItem(result from Lists collection).access the items column.add the new item from user input
      listItem.items.push(newItem);
      listItem.save();

      res.redirect("/" + listName);
    })
  }

});

app.post("/delete", function(req, res) {


  // from checkbox in list.ejs
  const checkedItemId = req.body.removeItem;
  const listName = req.body.listName;

  if (listName === 'Today') {
    Item.findByIdAndRemove({_id: checkedItemId}, function(err, foundList) {
      if(!err) {
        console.log(foundList);
        
        console.log(listName);
        res.redirect("/");
      }
    });
  } else {
    // @param1  which lish do you want to find
    // @param2  specify you want to pull on the items array on lists collection that has an ID of user input ID
    List.findOneAndUpdate({name: listName}, { $pull: { items: { _id: checkedItemId } } }, (err, foundList) => {
      if(!err) {
        // console.log(checkedItemId)
        res.redirect("/" + listName);
      }
    });
  }
  
  // if (listName === 'Today') {

  //   // List.findByIdAndDelete({ _id: checkedItemId}, { $pull: { items: { _id: checkedItemId}}}, (err, foundList) => {
  //   //   if (!err) {
  //   //     console.log('The id: ' + checkedItemId);
  //   //     res.redirect("/");      }
  //   // });

  //   List.findByIdAndRemove({ _id: checkedItemId}, function(err, foundList) {
  //     if(!err) {
  //       console.log("Successfully removed!");
  //       res.redirect("/");
  //     } else {
  //       console.log("Not on the list");
  //     }
  //   });
    
  // } else {

  // }

});


app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
