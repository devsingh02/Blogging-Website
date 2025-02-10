const mongoose=require('mongoose');
exports.connect=()=>{ // defining function names 'connect' and making it available to other files

    mongoose.connect("mongodb://127.0.0.1:27017",{ // default port no. that MongoDB servers usually listen on
        useNewUrlParser:true,
        useUnifiedTopology:true,
    })
    .then(()=>console.log('db connected'))
    .catch((error)=>{                      // arrow function that takes 'error' as argument
        console.log("db connected failed");
        console.log(error);
    })

}
