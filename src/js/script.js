export { setLoadTimeout, postMessage, bindAllFunc };
import Chat from './Chat';

/** Адрес сервера
 * @constant
 * @type {String}
 */
const SERVER_URL = 'http://localhost:8080';

/**
 * Время (в миллисекундах), через которое будет опрашиваться сервер на наличие новых вх. сообщений
 * @constant
 * @type {Number}
 */
const CLIENT_SITE_LISTENER_DELAY = 5000;

/**
 * Текст сообщения о серверной ошибке
 * @constant
 * @type {String}
 */
const SERVER_ERROR = 'Не удалось отправить сообщение';

/**
 * Экземпляр класса 'Чат'
 */
let chat;

/**
 * Отправка исходящего сообщения
 */
function postMessage() {
  // Формирование кросс-браузерного запроса
  let xhr = _createCorsRequest('POST', SERVER_URL + '/message');
  xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
  if (!xhr) {
    throw new Error('CORS not supported');
  }

  // Формирование тела запроса
  let request = chat.sendMessage();
  let jsonRequest = JSON.stringify(request);

  // Обработчик успешного выполнения запроса
  xhr.onload = function() {
    chat.renderMessage('user', request.message);
    _removeLoadingError();
  };

  // Обработчик запроса, при выполнении которого возникла ошибка
  xhr.onerror = function() {
    _showLoadingError();
  };

  // Отправка запроса
  xhr.send(jsonRequest);
}

/**
 * Получение входящего сообщения
 */
function _getMessage() {
  // Формирование параметров запроса
  let requestParamsObj = chat.getMessage();
  let requestParams;
  for(var key in requestParamsObj) {
    if(requestParamsObj.hasOwnProperty(key)) {
      requestParams = requestParams ? (requestParams + '&') : '';
      requestParams += key + '=' + encodeURI(requestParamsObj[key]);
    }
  }

  // Формирование кросс-браузерного запроса
  let xhr = _createCorsRequest('GET', SERVER_URL + '/message' + '?' + requestParams);
  if (!xhr) {
    throw new Error('CORS not supported');
  }

  // Обработчик успешного выполнения запроса
  xhr.onload = function(event) {
    let response = JSON.parse(event.target.response);
    chat.renderMessage('org', response.message);
    _removeLoadingError();
  };

// Отправка запроса
  xhr.send(null);

  // Запуск следующего цикла слушателя новых вх. сообщений
  setLoadTimeout();
}

/**
 * Функция, вызов которой запускает слушателя, который по настроенному расписанию
 * опрашивает сервер на наличие новых сообщений
 */
function setLoadTimeout() {
  setTimeout(_getMessage, CLIENT_SITE_LISTENER_DELAY);
}

/**
 * Отрисовка сообщения об ошибке, возникшей при выполнении запроса к серверу
 */
function _showLoadingError() {
  let serverError = document.querySelector('.server-error');
  if (serverError) {
    serverError.innerText = SERVER_ERROR;
  } else {
    chat.renderServerError();
    document.querySelector('.server-error').innerText = SERVER_ERROR;
  }
}

/**
 * Удаление из DOM серверного сообщения об ошибке
 */
function _removeLoadingError() {
  let serverError = document.querySelector('.server-error');
  if(serverError) {
    let serverErrorParent = document.querySelector('.chat__controls');
    chat.removeElement(serverErrorParent, serverError);
  }
}

/**
 * Создание скросс-браузерного XMLHttpRequest
 * @param  {String} method Тип запроса (GET, POST....)
 * @param  {String} url    Адрес Веб-сервера
 * @return {}
 */
function _createCorsRequest(method, url) {
  let xhr = new XMLHttpRequest();
  if ('withCredentials' in xhr) {
    xhr.open(method, url, true);
  } else if (typeof XDomainRequest !== 'undefined') {
    // Для IE
    xhr = new XDomainRequest();
    xhr.open(method, url);
  } else {
    xhr = null;
  }
  return xhr;
}

/**
 * Функция, позволяющая избежать потери контекста
 * @param  {Object} object
 */
function bindAllFunc(object) {
  for (var property in object) {
    if (typeof object[property] === 'function') {
      object[property] = object[property].bind(object);
    }
  }
}

/**
 * Обработчик события загрузки страницы
 */
function _onPageLoad() {
  chat = new Chat();
  chat.renderChatBtn();
  chat.chatAutoOpen();
}

// Навешивание события загрузки страницы
window.addEventListener('load', _onPageLoad);
