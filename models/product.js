const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    id:{type : String},
    title:{type : String},
    body_html:{type : String},
    vendor:{type : String},
    product_type:{type : String},
    created_at:{type : String},
    handle:{type : String},
    updated_at:{type : String},
    published_at:{type : String},
    template_suffix:{type : String},
    status:{type : String},
    tags:{type : String},
    admin_graphql_api_id:{type : String},
    variants:{type : Array},
    options:{type : Array}
})
module.exports = mongoose.model('Product',productSchema);