const mongoose = require('mongoose')
 
 
const expensesSchema = new mongoose.Schema({
    expensesId :{type: String},
    item: { type: String  },
    expanseName: { type: String  },
    purchaseDate :{type: String},
    purchaseBy :{type: String},
    amount :{type: String},
    paidBy :{type: String},
    status: { type: String, default: 'Pending' },
    files:[{type: String}],
    createdAt: { type: Date, default: Date.now },
    updatedAt : { type: Date, default: Date.now }
  }); 

 

 const Expenses = mongoose.model('Expenses', expensesSchema);
 
module.exports =  Expenses 
