const { User } = require(`../model/index.model`);
const bcrypt = require(`bcrypt`);
const jwt = require(`jsonwebtoken`);

/*

{{{{{{{{{{{{{{{{{{{{{{<<<<<<<<<<<<<<<<<<<<<<<<<<<<User controller start>>>>>>>>>>>>>>>>>>>>>>>>>>>>}}}}}}}}}}}}}}}}}}}}}}

*/
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: false,
        message: "Please provide both email and password to login",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        status: false,
        message: "Invalid credentials",
        user,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        status: false,
        message: "Invalid credentials",
      });
    }

    const payload = {
      id: user._id,
      name: user.userName,
      email: user.email,
      address: user.address,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: `1h`,
    });

    return res.status(200).json({
      status: true,
      message: `User logged in successfully`,
      token,
    });
  } catch (error) {
    console.error();
    return res.status(500).json({
      status: false,
      message: `Internal Server Error ${error.message}`,
    });
  }
};

exports.register = async (req, res) => {
  try {
    const { userName, email, password } = req.body;

    if (!userName || !email || !password) {
      return res.status(401).json({
        status: false,
        message: "Invalid fields",
      });
    }

    console.log(`req.body`, req.body);

    const hash = await bcrypt.hash(password, 10);

    const user = new User();

    user.userName = userName;
    user.email = email;
    user.password = hash;

    await user.save();

    return res.status(201).json({
      status: true,
      message: `user created succesfully`,
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: error.message });
  }
};

exports.userGet = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const skip = page * limit;
    const search = req.query.search || ``;

    console.log("search :>> ", search);

    const fieldsToSearch = [`userName`, `email`, `createdAt`];

    const matchQuery = {
      $or: fieldsToSearch.map((field) => ({
        [field]: { $regex: search, $options: `i` },
      })),
    };

    const commonPipeline = [
      {
        $match: matchQuery,
      },
    ];

    const paginationPipeline = [
      ...commonPipeline,
      { $skip: skip },
      { $limit: limit },
      { $sort: { createdAt: -1 } },
    ];

    const countPipeline = [...commonPipeline, { $count: `totalCount` }];

    const totalCountResult = await User.aggregate(countPipeline);
    const totalUsers =
      totalCountResult.length > 0 ? totalCountResult[0].totalCount : 0;

    const users = await User.aggregate(paginationPipeline);

    return res.status(200).json({
      status: true,
      message: `Users retrieved successfully`,
      users,
      userTotal: totalUsers,
    });
  } catch (error) {
    console.error(`Error fetching users:`, error);
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

exports.userDelete = async (req, res) => {
  try {
    const { userId } = req.query;
    const user = await User.findByIdAndDelete(userId);

    return res.status(200).json({
      status: true,
      message: `user created succesfully`,
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      msg: error.message,
    });
  }
};

exports.userUpdate = async (req, res) => {
  try {
    const { userId } = req.query;

    const { userName, email } = req.body;

    const user = await User.findById(userId);

    user.userName = userName || user.userName;
    user.email = email || user.email;

    await user.save();
    return res.status(200).json({
      status: true,
      message: `user updated successfully`,
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      msg: error.message,
    });
  }
};
exports.registerInWeb = async (req, res) => {
  try {
    const { userName, email, password } = req.body;

    if (!userName || !email || !password) {
      return res.status(401).json({
        status: false,
        message: `invalid fields`,
      });
    }

    const usera = await User.findOne({ email });

    if (usera) {
      return res.status(400).json({
        status: false,
        message: `User already exists`,
      });
    }

    console.log(`req.body`, req.body);

    const hash = await bcrypt.hash(password, 10);

    const user = new User();

    user.userName = userName;
    user.email = email;
    user.password = hash;

    await user.save();

    const payload = {
      id: user._id,
      name: user.userName,
      email: user.email,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: `1d`,
    });

    return res.status(200).json({
      status: true,
      message: `User logged in successfully`,
      token,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: error.message });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const { userId } = req.query;
    const { address, city, state, pincode } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: `User not found` });
    }

    user.address.push({ address, city, state, pincode });

    await user.save();

    const payload = {
      id: user._id,
      name: user.userName,
      email: user.email,
      address: user.address,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: `1d`,
    });

    return res
      .status(200)
      .json({ message: `Address added successfully`, token });
  } catch (error) {
    console.log(`error :>> `, error);
    return res.status(500).json({ msg: error.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.query;

    const { address, city, state, pincode } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: `User not found` });
    }

    const addressToUpdate = user.address.id(addressId);

    if (!addressToUpdate) {
      return res.status(404).json({ msg: `Address not found` });
    }

    addressToUpdate.address = address;
    addressToUpdate.city = city;
    addressToUpdate.state = state;
    addressToUpdate.pincode = pincode;

    await user.save();

    const payload = {
      id: user._id,
      name: user.userName,
      email: user.email,
      address: user.address,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: `1d`,
    });

    return res
      .status(200)
      .json({ message: `Address updated successfully`, token });
  } catch (error) {
    console.log(`error :>> `, error);
    return res.status(500).json({ msg: error.message });
  }
};

exports.removeAddress = async (req, res) => {
  try {
    const { userId } = req.query;
    const { addressId } = req.query;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: `User not found` });
    }

    console.log(`object :>>`, user.address.id);
    user.address.id(addressId).deleteOne();

    await user.save();

    const payload = {
      id: user._id,
      name: user.userName,
      email: user.email,
      address: user.address,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: `1d`,
    });

    return res
      .status(200)
      .json({ message: `Address removed successfully`, token });
  } catch (error) {
    console.log(`error :>> `, error);
    return res.status(500).json({ msg: error.message });
  }
};
   
// {{{{{{{{{{{{((((((<<<<<<<<<<<<<< User Controller End >>>>>>>>>>>>>>}}))))})))}}}}}}}}

 exports.addUser = async(req,res)=>{
  try {
    const {userName,email,password}=req.body

    if (!userName || !email || !password) {
      return res.status(401).json({
        status:false,
        message:"Inavlid fields !!"
      })
    }

    const hash = await bcrypt.hash(password,10)

    const user = new User()
    user.userName = userName
    user.email = email 
    user.password = hash 

    await user.save()

    return res.status(201).json({
      status:true,
      message:"User Craeted Successfully",
      user
    })
  } catch (error) {
    console.log('error :>> ', error);
    return res.status(500).json({
      status:false,
      message:"Internal server error !!!"
    })
  }
 }

 exports.getUser = async(req,res) =>{
  try {
    const page = req.query.page || 0;
    const limit = req.query.limit || 10;
    const skip = page * limit;
    const search = req.query.search || ''
    const fieldsToSearch = ['userName','email','craetedAt']

    const matchQuery = {
      $or: fieldsToSearch.map((field) => ({
        [field]: { $regex: search, $options: `i` },
      })),
    };

    const commonPipeline = [
      {$match: matchQuery}
    ]

    const countPipeline = [
      ...commonPipeline,
      {$count:'totalcount'}
    ]

    const paginationPipeline = [
      ...commonPipeline,
      {$skip:skip},
      {$limit:limit},
      {$sort:{createdAt:-1}}
    ]

    const totalUser = await User.aggregate(countPipeline)

    const user = await User.aggregate(paginationPipeline)

    return res.status(200).json({
      status:true,
      userTotal:totalUser,
      user
    })
  } catch (error) {
    console.log('error :>> ', error);
    return res.status(500).json({
      status:false,
      message:"Internal Server Error !!!"
    })
  }
 }

 exports.updateUser = async(req,res)=>{
  try {
    const {userId}=req.query

    const {userName,email ,password}=req.body

    if (!userId) {
      return res.status(401).json({
        status:false,
        message:"Inavlid fields !!!"
      })
    }

    const user = await User.findById(userId)

    if (!user) {
      return res.status(401).json({
        status:false,
        message:"User not Found !!!"
      })
    }

    user.userName = userName || user.userName
    user.email = email || user.email 
    user.password =  await bcrypt.hash(password,10) || user.password

    await user.save()

    return res.status(201).json({
      status:true,
      message:"User updated successfully",
      user
    })
  } catch (error) {
    return res.status(500).json({
      status:false,
      message:"Internal Server Error !!!"
    })
  }
 }

 exports.deleteOne = async(req,res)=>{
  try {
    const {userId}=req.query

    if (!userId) {
      return res.status(401).json({
        status:false,
        message:"Inavlid fields !!!"
      })
    }

    const user = await User.findById(userId)

    if (!user) {
      return res.status(401).json({
        status:false,
        message:"User not Found !!!"
      })
    }

    await user.remove()

    return res.status(201).json({
      status:true,
      message:"User deleted successfully",
      user
    })
  } catch (error) {
    console.log('error', error)
    return res.status(500).json({
      status:false,
      message:"Internal Server Error !!!"
    })
  }
 }

 exports.asasas = async(req,res)=>{
  try {
    const {userName ,email ,password} =req.body

    const hash = await bcrypt.hash(password,10)

    if (!userName || !email || !password) {
      return res.status(401).json({
        status:false,
        message:"Inavalid fields !!!"
      })
    }
    
    const user = new User()

    user.userName = userName
    user.email = email 
    user.password = hash 

    await user.save()

    return res.status(201).json({
      status:true,
      message:"User Created Successfully",
      user
    })
  } catch (error) {
    console.log('error', error)
    return res.status(500).json({
      status:false,
      message:"Internal Server Error !!!"
    })
  }
 }

 exports.fdfdfdf = async(req,res)=>{
  try {
    const page = req.query.page || 0
    const limit = req.query.limit || 10
    const skip = page*limit
    const search = req.query.search || ''
    const fieldsToSearch = ['userName','email','craetedAt']

    const matchQuery = {
      $or:fieldsToSearch.map((field)=>({
        [field]:{$regex:search,$options:'i'}
      }))
    }

    const commonPipeline = [
      {
        $match : matchQuery
      }
    ]

    const countPipeline = [
      ...commonPipeline,
      {
        $count:'totalcount'
      }
    ]

    const paginationPipeline = [
      ...commonPipeline,
      {$skip:skip},
      {$limit:limit},
      {$sort:{createdAt:-1}}
    ]

    const totalUser = await User.aggregate(countPipeline)

    const user = await User.aggregate(paginationPipeline)

    return res.status(200).json({
      status:true,
      userTotal:totalUser,
      user
    })
  } catch (error) {
    console.log('error', error)
    return res.status(500).json({
      status:false,
      message:"Internal Server Error !!!"
    })
  }
 }

 const klklklkl = async(req,res)=>{
  try {
    const {userId}=req.query

    if (!userId) {
      return res.status(401).json({
        status:false,
        message:"Inavlid fields !!!"
      })
    }

    const user = await User.findById(userId)

    if (!user) {
      return res.status(401).json({
        status:false,
        message:"User not Found !!!"
      })
    }

    user.userName = userName || user.userName
    user.email = email || user.email 
    user.password =  await bcrypt.hash(password,10) || user.password

    return res.status(201).json({
      status:false,
      message:"User updated successfully",
      user
    })
  } catch (error) {
    console.log('error', error)
    return res.status(500).json({
      status:false,
      message:"Internal Server Error !!!"
    })
  }
 }

 exports.rtrrttttt = async(req,res)=>{
  try {
    const {userId} =req.query

    if (!userId) {
      return res.status(401).json({
        status:false,
        message:"Inavalid fields !!!"
      })
    }

    const user = await User.findById(userId)  

    if (!user) {
      return res.status(401).json({
        status:false,
        message:"User not Found !!!"
      })
    }

    await user.remove()
  } catch (error) {
    console.log('error', error)
    return res.status(500).json({
      status:false,
      message:"Internal Server Error !!!"
    })
  }
 }

 exports.jkkjjjkjjkjk = async(req,res)=>{
  try {
    const {userName , email ,password}=req.body

    if (!userName || !email ||!password) {
      return res.status(401).json({
        status:false,
        message:"Inavalid fields !!!"
      })
    }

    const hash = await bcrypt.hash(password,10)

    const user = new User()

    user.userName = userName 
    user.email = email 
    user.password = hash

    await user.save()

    return res.status(201).json({
      status:true,
      message:"User created successfully !!!",
      user,
    })
  } catch (error) {
    console.log('error', error)
    return res.status(500).json({
      status:false,
      message:"Internal Server Error !!!"
    })
  }
 }

 exports.gbgbbgbg = async(req,res)=>{
  try {
    const page = req.query.page || 0
    const limit = req.query.limit || 10
    const search = req.query.search || ''
    const skip = page * limit
    const fieldsToSearch = ['userName','eamil','craetedAt']
    const matchQuery = {
      $or:fieldsToSearch.map((field)=>({
        [field]:{$regex:search,$options:'i'}
      }))
    }

    const commonPipeline = [
      {
        $match : matchQuery
      }
    ]

    const countPipeline = [
      ...commonPipeline,
      {
        $count:'totalcount'
      }
    ]

    const paginationPipeline = [
      ...commonPipeline,
      {$skip:skip},
      {$limit:limit},
      {$sort:{createdAt:-1}}
    ]

    const totalUser = await User.aggregate(countPipeline)

    const user = await User.aggregate(paginationPipeline)

    return res.status(200).json({
      status:false,
      message:"User get successfully !!!",
      totalUser,
      user
    })
  } catch (error) {
    console.log('error', error)
    return res.status(500).json({
      status:false,
      message:"Internal Server Error !!!"
    })
  }
 }

 exports.lplqlqlq = async(req,res)=>{
  try {
    const {userId}=req.query

    if (!userId) {
      return res.status(401).json({
        status:false,
        message :"Inavalid fields !!!"
      })
    }

    const user= await User.findById(userId)

    if (!user) {
      return res.status(401).json({
        status:false,
        message :"Inavalid userId !!!"  
      })
    }

    user.userName = userName||user.userName
    user.email = email||user.email
    user.password =await bcrypt.hash(password,10) || user.password 

    await user.save()

    return res.status(201).json({
      status:false,
      message:"User updated successfully !!!",
      user
    })
  } catch (error) {
    console.log('error', error)
    return res.status(500).json({
      status:false,
      message:"Internal Server Error !!!"
    })
  }
 }


 exports.qwqwqwqw = async(req,res)=>{
  try {
    const {userId}=req.query

    if (!userId) {
      return res.status(401).json({
        status:false,
        message:"Inavalid fields !!!"
      })
    }

    const user = await User.findById(userId)

    if (!user) {
      return res.status(401).json({
        status:false,
        message:"Inavalid userId !!!"
      })
    }

    await user.remove()

    return res.status(201).json({
      status:false,
      message:"User deleted successfully !!!",
      user
    })
  } catch (error) {
    console.log('error', error)
    return res.status(500).json({
      status:false,
      message:"Internal Server Error !!!"
    })
  }
 }

 exports.asdfghgjkl = async(req,res)=>{
  try {
    const {email,password}=req.body

    if (!email || !password) {
      return res.status(401).json({
        status:false,
        message:"Inavalid fields !!!"
      })
    }

    const user = await User.findOne({email})

    if (!user) {
      return res.status(401).json({
        status:false,
        message:"Invalid credentials !!!"
      })
    }

    const isMatch = await bcrypt.compare(password,user.password)

    if (!isMatch) {
      return res.status(401).json({
        status:false,
        message:"Invalid credentials !!!"
      })
    }

    return res.status(201).json({
      status:false,
      message:"User login successfully !!!",
      user
    })
  } catch (error) {
    console.log('error :>> ', error);
    return res.status(500).json({
      status:false,
      message:"Internal Server Error !!!"
    })
  }
 }

 exports.aaaaaaaaaaaaaaaaa = async(req,res)=>{
  try {
    const {email ,userName ,password}=req.body

    if (!email || !userName ||!password) {
      return res.status(401).json({
        status:false,
        message:"Invalid fields or required fields required !!!"
      })
    }

    const user = await User()

    user.email = email 
    user.userName = userName
    user.password = await bcrypt.hash(password,10)

    await user.save()

    return res.status(201).json({
      status:false,
      message:"User created successfully !!!",
      user
    })
  } catch (error) {
    console.log('error :>> ', error);
    return res.status(500).json({
      status:false,
      message:"Internal Server Error !!!"
    })
  }
 }

 exports.mkmkknknc= async(req,res)=>{
  try {
    const {email,password}=req.body

    if (!email || !password) {
      return res.status(401).json({
        status:false,
        message:"Invalid fields !!!"
      })
    }

    const user = await User.findOne({email})

    if (!user) {
      return res.status(401).json({
        status:false,
        message:"Invalid credentials !!!"
      })
    }

    const isMatch = await bcrypt.compare(password,user.password)

    if (!isMatch) {
      return res.status(401).json({
        status:false,
        message:"Invalid credentials !!!"
      })
    }
  
    const payload = {
      id:user._id,
      name:user.userName,
      email:user.email,
    }

    const token =  jwt.sign(payload,process.env.JWT_SECRET,{expiresIn:"1d"})

    res.cookie("token",token,{httpOnly:true})

    return res.status(201).json({
      status:true,
      message:"User login SuccessFully !!!",
      token
    })
  } catch (error) {
    console.log('error', error)
    return res.status(500).json({
      status:false,
      message:"Internal Server Error !!!"
    })
  }
 }


 exports.kmbbhbhbhb = async(req,res)=>{
  try {
    const page = parseInt(req.query.page ) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const skip = page*limit

    const search = req.query.search || ``
    const fieldsToSearch = [`userName`,`email`,`createdAt`]

    const matchQuery = {
      $or: fieldsToSearch.map((field)=>({
        [field]:{$regex:search,$options:'i'}
      }))
    }

    const commonPipeline = [
      {
        $match:matchQuery
      }
    ]

    const countPipeline = [
      ...commonPipeline,
      {$count:'total'}                               
    ]

    const paginationPipeline = [
      ...commonPipeline,
      {$skip:skip},
      {$limit:limit},
      {$sort:{createdAt:-1}}
    ]

    const userTotal = await User.aggregate(countPipeline)

    const user = await User.aggregate(paginationPipeline)

    return res.status(201).json({
      status:true,
      message:"User get successfully !!!",
      userTotal,
      user
    })
  } catch (error) {
    console.log('error :>> ', error);
    return res.status(500).json({ 
      status:false,
      message:"Internal Server Error !!!"
    })
  }
 }

 exports.mqmqmqmqmqmq=async(req,res)=>{
  try {
    const {userId}=req.query

    if (!userId) {
      return res.status(401).json({
        status:false,
        message:"Invalid fields !!!"
      })
    }

    const user = await User.findById(userId)

    if (!user) {
      return res.status(401).json({
        status:false,
        message:"Invalid credentials !!!"
      })
    }

    user.userName = req.body.userName || user.userName
    user.email = req.body.email || user.email
    user.password = req.body.password || user.password

    await user.save() 

    return res.status(201).json({
      status:true,
      message:"User updated successfully !!!",
      user
    })
  } catch (error) {
    console.log('error :>> ', error);
    return res.status(500).json({
      status:false,
      message:"Internal Server Error !!!"
    })
  }
 }

 exports.lsnz= async(req,res)=>{
  try {
    const {userName,email,password}=req.body

    if (!userName || !email || !password) {
      return res.status(401).json({
        status:false,
        message:"Invalid user fields !!!"
      })
    }

    const user = await User()

    user.userName = userName
    user.email = email 
    user.password = await bcrypt.hash(password,10)

    await user.save()

    return res.status(201).json({
      status:true,
      message:"User created successfully !!!",
      user
    })
  } catch (error) {
    console.log('error :>> ', error);
    return res.status(500).json({
      status:false,
      message:"Internal Server Error !!!"
    })
  }
 }