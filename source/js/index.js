import '../style/index.scss';
import 'normalize.css';

let allFriendsList = {},
    myFriendsSelectedList = {},
    contentBg = document.querySelector('.content-bg'),
    friendsContainer = document.querySelector('.friends-container'),
    dndContainerFriends = document.querySelector('.friends-container_dnd'),
    main = document.querySelector('.main'),
    searchLeft = document.querySelector('.search-full'),
    searchRight = document.querySelector('.search-list'),
    saveButton = document.querySelector('.save-btn');



//Получение и добавление списка друзей на страницу

VK.init({
    apiId: 6308497
});


function auth() {
    return new Promise( (resolve, reject) => {
        VK.Auth.login((data) =>{
            if(data.session) {
                resolve();
            } else {
                reject(new Error('Не удалось авторизоваться'));
            }
        }, 2 | 4);
    })
}


function callAPI(method, params) {
    params.v = '5.69';

    return new Promise( (resolve, reject) => {
        VK.api(method, params, (data) => {
            if(data.error) {
                reject(data.error);
            } else {
                resolve(data.response);
            }
        })
    })
}

(async () => {
    await auth();

    let friends = await callAPI('friends.get', {fields: 'photo_50'});


    const template = document.querySelector('#user-template').textContent;
    const render = Handlebars.compile(template);
    const html = render(friends);

    friendsContainer.innerHTML = html;

})();


// START DRAG & DROP

let dragObj = {};

main.addEventListener('mousedown', (e) => {
    //исключаем выделение текста(действие по умолчанию)
    e.preventDefault();

    //исключаем клик по правой клавише
    if( e.which != 1 ) return;

    let elem = e.target.closest('.friend');

    if(!elem) return;

    dragObj.elem = elem;
    dragObj.downX = e.pageX;
    dragObj.downY = e.pageY;
});

document.addEventListener('mousemove', (e) => {
    if(!dragObj.elem) return;

    if(!dragObj.avatar) {
        let moveX = e.pageX - dragObj.downX,
            moveY = e.pageY - dragObj.downY;

        if(Math.abs(moveX) < 3 && Math.abs(moveY) < 3) return;

        dragObj.avatar = createAvatar(e);

        if(!dragObj.avatar) {
            dragObj = {};

            return;
        }

        let coords = getCoords(dragObj.avatar);

        dragObj.shiftX = e.pageX - coords.left;
        dragObj.shiftY = e.pageY - coords.top;

        startDrag(e);
    }

    dragObj.avatar.style.left = e.pageX - dragObj.shiftX + 'px';
    dragObj.avatar.style.top = e.pageY - dragObj.shiftY + 'px';

    return false;
});

document.addEventListener('mouseup', (e) => {
   //обработка переноса, если он начался
    if(dragObj.avatar) {
       finishDrag(e);
   }

    // очистка состояния переноса объекта dragObj
    dragObj = {};
});

function createAvatar() {
    // запоминаем старые свойства
    let avatar = dragObj.elem;

    let old = {
        parent: avatar.parentNode,
        nextSibling: avatar.nextSibling,
        position: avatar.position || '',
        left: avatar.left || '',
        top: avatar.top || '',
        zIndex: avatar.zIndex || ''
    };

    //отмена переноса
    avatar.rollback = () => {
        old.parent.insertBefore(avatar, old.nextSibling);
        avatar.style.position = old.position;
        avatar.style.left = old.left;
        avatar.style.top = old.top;
        avatar.style.zIndex = old.zIndex;
    };

    return avatar;
}

function getCoords(elem) {
    let box = elem.getBoundingClientRect();

    return {
        top: box.top + pageYOffset,
        left: box.left + pageXOffset
    };
}

function startDrag() {
    let avatar = dragObj.avatar;

    contentBg.appendChild(avatar);
    avatar.style.zIndex = 9999;
    avatar.style.position = 'absolute';
}

function finishDrag(e) {
    let dropElem = findDroppable(e);

    if(!dropElem || dropElem === dragObj.elem.parentNode) {
        dragObj.avatar.rollback();
    } else {
        dropingElem(dropElem);
    }
}

//обновление списков
function selectedUpd(elem) {
    Object.keys(allFriendsList).forEach((item, i) => {
        if(+elem.dataset.id === item.id) {
            myFriendsSelectedList.items.push(item);
            allFriendsList.items.splice(i, 1);
        }
    })
}

function allUpd(elem) {
    Object.keys(myFriendsSelectedList).forEach((item, i) => {
        if(+elem.dataset.id === item.id) {
            allFriendsList.items.push(item);
            myFriendsSelectedList.items.splice(i, 1);
        }
    })
}

//размещение элемента
function dropingElem(elem) {
    elem.appendChild(dragObj.elem);

    dragObj.elem.style.position = 'relative';
    dragObj.elem.style.left = 0;
    dragObj.elem.style.top = 0;

    if(elem.classList.contains('.friends-container_dnd')) {
        dragObj.elem.querySelector('.friend__add').classList.add('friend__add-rotate');

        selectedUpd(dragObj.elem);
    } else {
        dragObj.elem.querySelector('.friend__add').classList.remove('friend__add-rotate');

        allUpd(dragObj.elem);
    }
}

//определение дроп контейнера
function findDroppable (e) {
    //спрячем переносимый элемент
    dragObj.avatar.hidden = true;

    //получим самый вложенный элемент под курсором мыши
    let elem = document.elementFromPoint(e.clientX, e.clientY);

    //показать переносимый элемент обратно
    dragObj.avatar.hidden = false;

    if(elem == null) {
        return null;
    }

    return elem.closest('.friends-container_dnd') || elem.closest('.friends-container');
}

// END DRAG & DROP


//START добавление друзей по клику

function addFriendByClick(e) {
    if(e.target.classList.contains('.friend__add')) return;

    let elem = e.target.parentNode;

    if(elem.parentNode === friendsContainer) {
        friendsContainer.removeChild(elem);
        dndContainerFriends.appendChild(elem);

        selectedUpd(elem);
    } else if(elem.parentNode === dndContainerFriends) {
        dndContainerFriends.removeChild(elem);
        friendsContainer.appendChild(elem);

        allUpd(elem);
    }
}

main.addEventListener('click', addFriendByClick);

//END добавление друзей по клику

// START FILTER

searchLeft.addEventListener('keyup', ()  => {
    let listLeft = friendsContainer;

    for(let i = 0; i < listLeft.children.length; i++) {

        if(isMatching(listLeft.children[i].children[1].innerText, searchLeft.value)) {
            listLeft.children[i].style.display = 'inline-block';

        } else {
            listLeft.children[i].style.display = 'none';
        }
    }
});

searchRight.addEventListener('keyup', () => {
    let listRight = dndContainerFriends;

    for (let i = 0; i < listRight.children.length; i++) {

        if(isMatching(listRight.children[i].children[1].innerText, searchRight.value)) {
            listRight.children[i].style.display = 'inline-block';

        } else {
            listRight.children[i].style.display = 'none';
        }
    }
});

function isMatching (full, chunk) {
    return full.toLowerCase().includes(chunk.toLowerCase());
}

//END FILTER


