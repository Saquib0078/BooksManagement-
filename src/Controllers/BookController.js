const UserModel = require("../Models/UserModel")
const {body,isValidObjectId,isValidISBN, validation} = require("../middleware/validation");
const BooksModel = require("../Models/BooksModel");
const valid=require("validator");
const ReviewModel = require("../Models/ReviewModel");
const aws=require('aws-sdk')

aws.config.update({
    accessKeyId: "AKIAY3L35MCRZNIRGT6N",
    secretAccessKey: "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",
    region: "ap-south-1"
})

let uploadFile= async ( file) =>{
   return new Promise( function(resolve, reject) {
    // this function will upload file to aws and return the link
    let s3= new aws.S3({apiVersion: '2006-03-01'}); // we will be using the s3 service of aws

    var uploadParams= {
        ACL: "public-read",
        Bucket: "classroom-training-bucket",  //HERE
        Key: "abc/" + file.originalname, //HERE 
        Body: file.buffer
    }


    s3.upload( uploadParams, function (err, data ){
        if(err) {
            return reject({"error": err})
        }
        console.log(data)
        console.log("file uploaded succesfully")
        return resolve(data.Location)
    })

    // let data= await s3.upload( uploadParams)
    // if( data) return data.Location
    // else return "there is an error"

   })
}


//updated somthing here
let createBook= async function(req,res){
    
    try{
        let data= req.body
        if(!body(data)) return res.status(400).send({status:false,msg:"Input is Missing "})
        
        if(!validation(data.userId))return res.status(400).send({status:false,msg:"userId is mandatory "})
        const validUser= await UserModel.findById(data.userId)
        if(!validUser) return res.status(400).send({status:false,msg:"user not found"})
        if(!validation(data.title)) return res.status(400).send({status:false,msg:"title is mandatory"})

        let UniqueTitle =await BooksModel.findOne({title:data.title})
        if(UniqueTitle) return res.status(400).send({status:false,msg:"title  Must me Unique"})
        
        if(!(data.releasedAt))  return res.status(400).send({status:false,msg:"ReleaseDate is mandatory"})
        
        
        if(!isValidISBN(data.ISBN)) return res.status(400).send({status:false,msg:"ISBN should be of 13 digits"})
        let UniqueISBN =await BooksModel.findOne({ISBN:data.ISBN})
        
        if(UniqueISBN) return res.status(400).send({status:false,msg:" ISBN Must me Unique"})

        if(!(data.releasedAt))  return res.status(400).send({status:false,msg:"ReleaseDate is mandatory"})
         if(!valid.isDate(data.releasedAt))  return res.status(400).send({status:false,msg:"ReleaseDAte is not valid"})
        if(!validation(data.excerpt))  return res.status(400).send({status:false,msg:"excerpt is required"})
        if(!validation(data.category))  return res.status(400).send({status:false,msg:"category is required"})
        if(!validation(data.subcategory))  return res.status(400).send({status:false,msg:"subcategory is required"})
        if(req.files[0]){
            let files= req.files
            if(files && files.length>0){
                //upload to s3 and get the uploaded link
                // res.send the link back to frontend/postman
                var uploadedFileURL= await uploadFile( files[0] )
                res.status(201).send({msg: "file uploaded succesfully", data: uploadedFileURL})
            }
            else{
                res.status(400).send({ msg: "No file found" })
            }
        }
        data.bookCover= uploadedFileURL
        let savedUser= await BooksModel.create(data)

        return res.status(201).send({status:true,msg:"book created successfully",data:savedUser})

    }catch(error){
        return res.status(500).send({status:false,msg:error.message})
    }
}




const getBooks=async (req,res)=>{
    try {
        const booksData = req.query

        if (!body(booksData)) {
            const getData = await BooksModel.find({ isDeleted: false }).sort({ title: 1 }).select({ title: 1, excerpt: 1, userId: 1, category: 1, reviews: 1, releasedAt: 1 })
            if (getData.length === 0) {
                return res.status(404).send({ status: false, message: "No book found" })
            }
            return res.status(200).send({ status: false, message: "Books list", count: getData.length, data: getData })
        } else {
            const { userId, category, subcategory } = booksData
            const filter = {}

            if (userId) {
                const usersId = await UserModel.findOne({ _id: userId })
                if (!usersId) return res.status(400).send({ status: false, message: "Provide correct userId" })
                filter.userId = usersId
            }

            if (category) {
                filter.category = category
            }

            if (subcategory) {
                filter.subcategory = subcategory
            }
            filter.isDeleted = false
            if (userId || category || subcategory) {
                const getAllBooks = await BooksModel.find(filter).sort({ title: 1 }).select({ title: 1, excerpt: 1, userId: 1, category: 1, reviews: 1, releasedAt: 1 })
                if (getAllBooks.length === 0) return res.status(404).send({ status: false, message: "No books found" })
                return res.status(200).send({ status: true, message: "Books list", count: getAllBooks.length, data: getAllBooks })
            } else {
                return res.status(400).send({ status: false, msg: "filters can be userId, category, subcategory" })
            }

        }

    } catch (error) {
        return res.status(500).send({ status: false, error: error.message })
    }
}

    const getBookById= async function(req, res){
        try{
             let bookId=req.params.bookId
     if(!bookId) return res.status(400).send({status:false, msg: "BookId is required"})
     if(!isValidObjectId(bookId))
     return res.status(400).send({status:false, msg: "BookId is notValid"})

    let getBooks = await BooksModel.findOne({_id:bookId, isDeleted:false})
    if (!getBooks) return res.status(404).send({status:false, msg: "Data not found"})

    let getId=getBooks._id
    let getData=await ReviewModel.find({bookId:getId,isDeleted:false}).select({bookId:1,reviewedBy:1,reviewedAt:1,rating:1,review:1})
    if (getData.length == 0) {
        internlist = "No Reviews!!"
    } 
     let result={
        BookDetails:getBooks,
        reviewsData:getData
     }
     
          return res.status(200).send({status:true, msg:"Data found", result})
}catch(error){
            return res.status(500).send({status:false,msg:error.message})
        }
    }
    

const UpdateBooks=async (req,res)=>{
try {
let Book=req.params.bookId

let Update=await BooksModel.findById(Book)
if(Update.isDeleted==true) return res.status(400).send({status:false,msg:"data not found"})
    
let data=req.body
if(!body(data)) return res.status(400).send({status:false,msg:"Input is Missing"})

let UniqueTitle =await BooksModel.findOne({title:data.title})
if(UniqueTitle) return res.status(400).send({status:false,msg:"title  Must me Unique"})

// if(!isValidISBN(data.ISBN)) return res.status(400).send({status:false,msg:"ISBN should be of 13 digits"})
let UniqueISBN =await BooksModel.findOne({ISBN:data.ISBN})

if(UniqueISBN) return res.status(400).send({status:false,msg:" ISBN Must me Unique"})

let Updatebook=await BooksModel.findByIdAndUpdate({_id:Book},data,{new:true})
return res.status(200).send({status:true,msg:"Updated Successfully",data:Updatebook})

} catch (error) {
    return res.status(500).send({status:false,msg:error.message})
    
}
}



const deleteBooks = async function (req, res) {
    try {
        let bookId = req.params.bookId
        if (!bookId) return res.status(400).send({ status: false, msg: "BookId is required" })

        if (!isValidObjectId(bookId))
            return res.status(400).send({ status: false, msg: "BookId is not Valid" })

        const findbook = await BooksModel.findById(bookId)

        if (findbook.isDeleted == true) return res.status(404).send({ status: false, msg: "data is already deleted" })

        let DeletedBook = await BooksModel.findByIdAndUpdate({ _id: bookId }, { $set: { isDeleted: true, deletedAt: new Date() } })

        return res.status(200).send({ status: true, data: " Book Deleted successfully " })
    }
    catch (err) {
        console.log(err.message)
        res.status(500).send({ status: false, msg: err.message })
    }
}

module.exports = { createBook, getBookById, getBooks, deleteBooks,UpdateBooks,}

