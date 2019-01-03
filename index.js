let express = require('express')
let http = require('http')
let app = express()
let path = require('path')
let server = http.createServer(app)
let io = require('socket.io')(server);

let port = process.env.PORT || 3000
// app.get('/', (req, res) => {
// 	res.send('hello')
// })
server.listen(port, () => {
  console.log('Server listening at port %d', port);
});

app.use(express.static(path.join(__dirname, 'public')))
app.get('/', (req, res) => {
	console.log(req)
})
let connectRoom = {}

const changeAuth = (currentRoom, currentUser) => {
	for (let user in currentRoom) {
		if (user === currentUser) {
			currentRoom[user].canDown = false
		} else {
			currentRoom[user].canDown = true
		}
	}
}

//检查各个方向是否符合获胜条件
// function checkDirection (i,j,p,q,me) {
// 	//p=0,q=1 水平方向；p=1,q=0 竖直方向
// 	//p=1,q=-1 左下到右上
// 	//p=-1,q=1 左到右上
// 	let m = 1
// 	let n = 1
// 	let isBlack = me ? 1 : 2

// 	for (; m < 5; m++) {
// 		// console.log(`m:${m}`)
// 		if (!(i+m*p >= 0 && i+m*p <=14 && j+m*q >=0 && j+m*q <=14)) {
// 			break;
// 		} else {
// 			if (chessBoard[i+m*(p)][j+m*(q)] !== isBlack) {
// 			 break;
// 			}
// 		}
// 	}
// 	for (; n < 5; n++) {
// 		// console.log(`n:${n}`)
// 		if(!(i-n*p >=0 && i-n*p <=14 && j-n*q >=0 && j-n*q <=14)) {
// 			break;
// 		} else {
// 			if (chessBoard[i-n*(p)][j-n*(q)] !== isBlack) {
// 			 break;
// 			}
// 		}
// 	}
// 	if (n+m+1 >= 7) {
// 		return true
// 		// let msg = (isBlack===1) ? '黑方胜利!' : '白方胜利!';
// 		// alert(msg);
// 		// winner.innerHTML = msg;
// 		// cancelOne.disabled = true;
// 		// for (let i = 0; i < 15; i++) {
// 		// 	for (let j = 0; j < 15; j++) {
// 		// 		chessBoard[i][j] = 3
// 		// 	}
// 		// }
// 		// console.table(chessBoard)
// 	}
// }

// //检查是否获胜
// function checkWin (i,j,isBlack) {
// 	// console.table(chessBoard)
// 	if (checkDirection(i,j,1,0) || checkDirection(i,j,0,1) ||
// 		 checkDirection(i,j,1,-1) || checkDirection(i,j,1,1)) {
// 		return true
// 	}
// 	return false
// }

io.on('connection', (socket) => {
	console.log('connected')
	socket.on('enter', (data) => {
		// console.log(connectRoom[data.roomNo])
		//第一个用户进入，新建房间
		if (connectRoom[data.roomNo] === undefined) {
			connectRoom[data.roomNo] = {}
			connectRoom[data.roomNo][data.userName] = {}
			connectRoom[data.roomNo][data.userName].canDown = false
			connectRoom[data.roomNo].full = false
			console.log(connectRoom)
			socket.emit('userInfo', {
				canDown: connectRoom[data.roomNo][data.userName].canDown,
				// roomInfo:connectRoom[data.roomNo]
			})
			socket.emit('roomInfo', {
				roomNo: data.roomNo,
				roomInfo: connectRoom[data.roomNo]
			})
			socket.broadcast.emit('roomInfo', {
				roomNo: data.roomNo,
				roomInfo: connectRoom[data.roomNo]
			})
		} //第二个用户进入且不重名
		else if (!connectRoom[data.roomNo].full && 
			connectRoom[data.roomNo][data.userName] === undefined) {
			connectRoom[data.roomNo][data.userName] = {}
			connectRoom[data.roomNo][data.userName].canDown = true
			connectRoom[data.roomNo].full = true
			console.log(connectRoom)
			socket.emit('userInfo', {
				canDown: connectRoom[data.roomNo][data.userName].canDown,
				// roomInfo:connectRoom[data.roomNo]
			})
			socket.emit('roomInfo', {
				roomNo: data.roomNo,
				roomInfo: connectRoom[data.roomNo]
			})
			socket.broadcast.emit('roomInfo', {
				roomNo: data.roomNo,
				roomInfo: connectRoom[data.roomNo]
			})
		} //第二个用户进入但重名
		else if (!connectRoom[data.roomNo].full &&
			connectRoom[data.roomNo][data.userName]) {
			socket.emit('userExisted', data.userName)
		} //房间已满
		else if (connectRoom[data.roomNo].full) {
			socket.emit('roomFull', data.roomNo)
		}
	})
 
	socket.on('move', (data) => {
		let room = data.roomNo
		let user = data.userName
		if (connectRoom[room]["full"] && connectRoom[room][user].canDown) {
		// connectRoom[room][user].canDown = !data.isBlack
		// changeAuth ( connectRoom[room],user ) 
			socket.broadcast.emit('moveInfo', {
				i: data.i,
				j: data.j,
				isBlack: data.isBlack,
				userName: user,
				roomNo: room
			})
			socket.emit('moveInfo', {
				i: data.i,
				j: data.j,
				isBlack: data.isBlack,
				userName: user,
				roomNo: room
			})
			changeAuth(connectRoom[room], user)
		}
	})

	socket.on('userWin', (data) => {
		changeAuth(connectRoom[data.roomNo], data.userName)
		socket.emit('userWinInfo', {
			userName: data.userName,
			roomNo: data.roomNo
		})
		socket.broadcast.emit('userWinInfo', {
			userName: data.userName,
			roomNo: data.roomNo
		})
	})
})