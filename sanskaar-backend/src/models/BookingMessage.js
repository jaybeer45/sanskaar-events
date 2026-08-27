const mongoose = require ('mongoose') ;

const bookingMessageSchema = new mongoose.Schema(
    {
        booking : { type : mongoose.Schema.Types.ObjectId , ref : 'VendorBooking', required : true  },
        sender : {type : mongoose.Schema.Types.ObjectId , ref : 'User' , required : true } ,
        senderRole: { type : String , enum : ['customer' , 'vendor'] , required : true  } ,
        text: {type : String , required : true , trim : true , maxlength : 200  },
        attachmentUrl : {type : String , default : ''} ,
        readAt : {type : Date ,   default : null } ,

}, {timestamps : true}) ;

bookingMessageSchema.index({booking : 1 , createdAt : 1}) ;
module.exports = mongoose.model('BookingMessage' , bookingMessageSchema) ;