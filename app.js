//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//Connection creation and creating a new db
mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true})
.then(()=> console.log("Connection successfull...."))
.catch((err) => console.log(err));

//Creating Schema
const itemsSchema = new mongoose.Schema({
  name : String
});

//Creating collection
const Item = mongoose.model("Item",itemsSchema);

//Creating document
const item1 = new Item({
  name: "EAT"
});
const item2 = new Item({
  name: "SLEEP"
});
const item3 = new Item({
  name: "REPEAT"
});

//Creating an array to store items:
const defaultItems = [item1,item2,item3];
//For custon route items
const listSchema = new mongoose.Schema({
  name : String,
  items: [itemsSchema]
});

const List = mongoose.model("List",listSchema);

//Inserting items
/*Item.insertMany(defaultItems)
  .then(function(){
    console.log("Successfully saved into our DB.");
  })
  .catch(function(err){
    console.log(err);
  });*/

app.get("/", function(req, res) {
  const getDocument = async() =>{
  const result = await Item.find({});
  if(result.length === 0)
  {
    Item.insertMany(defaultItems)
      .then(function(){
        console.log("Successfully saved into our DB.");
      })
      .catch(function(err){
        console.log(err);
      });
   }
  //console.log(result);
  res.render("list", {listTitle: "Today", newListItems: result});
};
  getDocument();
});

app.get("/:name",function(req,res){
  const customListName = _.capitalize(req.params.name);
  const getDocument = async() =>{
  const result = await List.findOne({name:customListName});
  if(!result)
  {
    //Create new list
    console.log("Doesnt exist");
    const list = new List({
      name: customListName,
      items: defaultItems
    });
    async function saveIt()
        {
           try{ await list.save() }
           catch (err) { console.log(err) }
         }
    saveIt();
   res.redirect("/"+customListName);
  }
  else
  {
    //Show the existing list
    res.render("list", {listTitle:result.name, newListItems: result.items })
  }
}
getDocument();
});

//OR USE THIS METHOD
/*app.get('/:todoname', async(req, res) => {
    const todoName = req.params.todoname;
    let todo = await List.findOne({name: todoName})

    if(!todo){
        todo = new List({
            name: todoName,
            items: defaultItems
        })
        await todo.save();
    }

    res.render("list", {listTitle: todo.name, newListItems: todo.items})
})*/

//To save items entered by the user
app.post("/", function(req, res){

   const itemName = req.body.newItem;
   const listName = req.body.list;
   const item = new Item
   ({
     name : itemName
   });

   if(listName === "Today")
   {
     item.save();
     res.redirect
   }
   else {
     async function find() {
     const result = await List.findOne({name:listName});
     result.items.push(item);
     result.save();
     res.redirect("/"+listName);
   }
   find();
}

});

//Deleting a checked item
app.post("/delete",function(req,res){
  const checkedItem = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today")
  {
    const deleteDocument = async(_id)=>{
    try{
      const result = await Item.deleteOne({_id});
    //  console.log(result);
    res.redirect("/");
    }catch(err){
      console.log(err);
    }
  }
  deleteDocument(checkedItem);
  }
  else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItem}}}).then(function (foundList)
       {
         res.redirect("/" + listName);
       });
}

});

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
