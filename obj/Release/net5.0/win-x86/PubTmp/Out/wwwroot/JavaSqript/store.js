if (document.readyState == 'loading') {
    document.addEventListener('DOMContentLoaded', ready)
} else {
    ready()
}

function ready() {
    //const token = login();
    getShopItems();
    getCartItems();

    document.getElementsByClassName('btn-purchase')[0].addEventListener('click', purchaseClicked)
    document.getElementsByClassName('btn-delete-cart')[0].addEventListener('click', deleteClicked)
}

function login() {
    const uri = 'https://localhost:44367/Auth/Login';
    const params = {
        userName: 'TestUser',
        password: '1234'
    }

    var xhttp = new XMLHttpRequest();
    //xhttp.open("POST", uri, true, "TestUser", "1234");
    xhttp.open("POST", uri, true);
    xhttp.setRequestHeader('Content-type', 'application/json');
    
    
    xhttp.onreadystatechange == function () {
        console.log(this.responseText);
        
    }
    xhttp.send(JSON.stringify(params));
    //xhttp.send();
}


function getShopItems() {
    const uri = 'https://localhost:44373/shopitem';
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", uri, true);

    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var albums = document.getElementsByClassName('music')[0];
            var merchs = document.getElementsByClassName('merch')[0];

            Array.from(JSON.parse(this.responseText).data).forEach(data => {
                var item = document.createElement('div');
                item.classList.add('shop-item');

                var itemContent = `
                    <input class="shop-item-id" type="hidden" value="${data.id}">
                    <input class="shop-item-quantity" type="hidden" value="${data.quantity}">
                    <span class="shop-item-title">${data.title}</span>
                    <img class="shop-item-image" src="${data.imagePath}" />
                    <div class="shop-item-details">
                        <span class="shop-item-price">$${data.price}</span>
                        <button class="btn btn-primary btn-shop-item" role="button">ADD TO CART</button>
                    </div>
                `

                item.innerHTML = itemContent;

                if (data.title.includes("Album"))
                    albums.append(item);
                else
                    merchs.append(item);

                item.getElementsByClassName('btn-shop-item')[0].addEventListener('click', addToCartClicked);
            });
        }
    };

    xhttp.send();
}

function getCartItems() {
    const uri = 'https://localhost:44367/cart';
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", uri, true);

    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            Array.from(JSON.parse(this.responseText).data).forEach(data => {
                addItemToCart(data.cartItem.id, data.cartItem.title, data.cartItem.price, data.cartItem.imagePath, data.cartItem.quantity);
            });
        }
    };

    xhttp.send();
}

function purchaseClicked() {
    const uri = "https://localhost:44367/orderhistory";
    fetch(uri, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    }).then(response => {
        if (response.status == 200) {
            var cartItems = document.getElementsByClassName('cart-items')[0]
            while (cartItems.hasChildNodes()) {
                cartItems.removeChild(cartItems.firstChild)
            }

            updateCartTotal();
            alert('Thank you for your purchase')
        }
    }).catch((error) => {
        console.error(error);
    });
}

function deleteClicked() {
    const uri = "https://localhost:44367/cart/";
    fetch(uri, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
    }).then(response => {
        if (response.status == 200) {
            var cartItems = document.getElementsByClassName('cart-items')[0];
            while (cartItems.hasChildNodes()) {
                cartItems.removeChild(cartItems.firstChild)
            }

            updateCartTotal();
            alert('Cart deleted')
        }
    }).catch((error) => {
        console.error(error);
    });
}

function removeCartItem(event) {
    var buttonClicked = event.target
    var cartRow = buttonClicked.parentElement.parentElement;
    var id = cartRow.getElementsByClassName('cart-item-id')[0].value;
    const uri = "https://localhost:44367/cart/" + id;

    fetch(uri, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
    }).then(response => {
        if (response.status == 200) {
            cartRow.remove();
            updateCartTotal();
        }
    }).catch((error) => {
        console.error(error);
    });
}


function quantityChanged(event) {
    var input = event.target;

    var cartItem = input.parentElement.parentElement;
    var shopItems = document.getElementsByClassName('shop-items');
    if (!CheckShopItemQuantity(shopItems, cartItem, false)) {
        input.value -= 1;
        alert('Shop item storage value is ' + input.value);
        return;
    }

    const params = {
        id: cartItem.getElementsByClassName('cart-item-id')[0].value,
        quantity: input.value
    }

    const uri = "https://localhost:44367/cart";
    fetch(uri, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
    }).then(response => {
        if (response.status == 200) {
            updateCartTotal();
        }
    }).catch((error) => {
        console.error(error);
    });
}

function CheckShopItemQuantityPurchased(shopItems, cartItems) {
    var returnObj = [];
    for (var cartItemIndex = 0; cartItemIndex < cartItems.children.length; cartItemIndex++) {
        var cartItem = cartItems.children[cartItemIndex];
        var returnObj = CheckShopItemQuantity(shopItems, cartItem, true);

        if (!returnObj[0])
            returnObj.push(cartItem, returnObj[1]);
    }

    return returnObj;
}

function CheckShopItemQuantity(shopItems, cartItem, apiCall) {
    var cartItemID = cartItem.getElementsByClassName('cart-item-id')[0].value
    var shopItem = null;

    if (apiCall) {
        for (var i = 0; i < shopItems.children.length; i++)
            if (cartItemID == shopItems.children[i].getElementsByClassName('shop-item-id')[0].value) {
                shopItem = shopItems.children[i];
                break;
            }
    } else {
        for (var sectionIndex = 0; sectionIndex < shopItems.length; sectionIndex++) {
            if (shopItem != null)
                break;

            for (var i = 0; i < shopItems[sectionIndex].children.length; i++)
                if (cartItemID == shopItems[sectionIndex].children[i].getElementsByClassName('shop-item-id')[0].value) {
                    shopItem = shopItems[sectionIndex].children[i];
                    break;
                }
        }
    }
        
    var shopItemQuantity = shopItem.getElementsByClassName('shop-item-quantity')[0].value;
    var cartItemQuantity = cartItem.getElementsByClassName('cart-quantity-input')[0].value;
    if (Number(cartItemQuantity) > Number(shopItemQuantity)) {
        if (apiCall)
            return [false, shopItem];
        else
            return false;
    } else {
        if (apiCall)
            return [true, shopItem];
        else
            return true;
    }
}

function addToCartClicked(event) {
    var buttonClicked = event.target;
    var shopItem = buttonClicked.parentElement.parentElement;

    var cartItems = document.getElementsByClassName('cart-items')[0];
    for (var i = 0; i < cartItems.children.length; i++) {
        var cartItemTitle = cartItems.children[i].getElementsByClassName('cart-item-title')[0].innerHTML;
        var shopItemTitle = shopItem.getElementsByClassName('shop-item-title')[0].innerHTML;
        if (cartItemTitle == shopItemTitle) {
            alert('This item is already added to the cart')
            return
        }
    }

    const params = {
        id: shopItem.getElementsByClassName('shop-item-id')[0].value,
        quantity: 1
    }

    const uri = "https://localhost:44367/cart";
    fetch(uri, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
    }).then(response => response.json()).then(data => {
        while (cartItems.hasChildNodes()) {
            cartItems.removeChild(cartItems.firstChild);
        }

        Array.from(data.data).forEach(data => {
            addItemToCart(data.cartItem.id, data.cartItem.title, data.cartItem.price, data.cartItem.imagePath, data.cartItem.quantity);
        });
    }).catch((error) => {
        console.error(error);
    });
}

function addItemToCart(id, title, price, imageSrc, quantity) {
    var cartRow = document.createElement('div')
    cartRow.classList.add('cart-row')
    var cartItems = document.getElementsByClassName('cart-items')[0]

    var cartRowContents = `
        <div class="cart-item cart-column">
            <input class="cart-item-id" type="hidden" value="${id}">
            <img class="cart-item-image" src="${imageSrc}" />
            <span class="cart-item-title">${title}</span>
         </div>
        <span class="cart-price cart-column">$${price}</span>
        <div class="cart-quantity cart-column">
            <input class="cart-quantity-input" type="number" value="${quantity}" />
            <button class="btn btn-danger btn-delete-item" type="button">REMOVE</button>
        </div>`

    cartRow.innerHTML = cartRowContents
    cartItems.append(cartRow)
    cartRow.getElementsByClassName('btn-delete-item')[0].addEventListener('click', removeCartItem)
    cartRow.getElementsByClassName('cart-quantity-input')[0].addEventListener('change', quantityChanged)

    updateCartTotal();
}

function updateCartTotal() {
    var cartItemContainer = document.getElementsByClassName('cart-items')[0]
    var cartRows = cartItemContainer.getElementsByClassName('cart-row')
    var total = 0;

    for (var i = 0; i < cartRows.length; i++) {
        var cartRow = cartRows[i]
        var cartPrice = cartRow.getElementsByClassName('cart-price')[0]
        var cartQuantity = cartRow.getElementsByClassName('cart-quantity-input')[0]
        var price = parseFloat(cartPrice.innerText.replace('$', ''))
        var quantity = cartQuantity.value

        total = total + (price * quantity)
    }

    total = Math.round(total * 100) / 100
    document.getElementsByClassName('cart-total-price')[0].innerText = '$' + total
}

