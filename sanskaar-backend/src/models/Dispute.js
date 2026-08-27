const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema(
    { 
        booking : {type : mongoose.Schema.Types.ObjectId , ref : 'VendorBooking' , required : true  },
        raisedBy : {type : mongoose.Schema.Types.ObjectId , ref : 'User' , required : true  },
        raisedByRole : {type : String , enum : ['customer' , 'vendor'] , required : true } ,

    reason : {
        type : String ,
        enum : ['no_show', 'quality_issue', 'payment_issue', 'cancellation', 'other'],
        required : true ,
    } , 
    
    description : {type: String , trim : true , required : true , maxlength : 2000 },
    attachments : [{type : String }], 

    status: { type: String, enum: ['open', 'under_review', 'resolved', 'rejected'], default: 'open' },
    resolution: { type: String, default: '' },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
    } , {timestamps : true }
) ;

module.exports = mongoose.model('Dispute', disputeSchema) ;