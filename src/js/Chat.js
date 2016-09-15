export default Chat;
import { setLoadTimeout, postMessage, bindAllFunc } from './script';
import audio from './audio.json';

/**
 * Текст заголовока
 * @constant
 * @type {String}
 */
const HEADER_TEXT = 'Напишите нам, мы онлайн!';

/**
 * Текст кнопки открытия чата
 * @constant
 * @type {String}
 */
const BTN_OPEN_TEXT = 'Напишите нам, мы онлайн!';

/**
 * Текст приветственного сообщения
 * @constant
 * @type {String}
 */
const TIP_TEXT = 'Добро пожаловать! Будем рады помочь!';

/**
 * Текст подсказки поля для ввода сообщения
 * @constant
 * @type {String}
 */
const MESSAGE_INPUT_PLACEHOLDER = 'Введите сообщение и нажмите Enter';

/**
 * Текст сообщения об ошибке для обязательного поля
 * @constant
 * @type {String}
 */
const INPUT_IS_REQUIRED_ERROR = 'Обязательное поле';

/**
 * Время (в миллисекундах) анимации скрытия окна чата
 * @constant
 * @type {Number}
 */
const CLOSE_CHAT_ANIMATE_DELAY = 1000;

/**
 * Код клавиши 'Enter'
 * @constant
 * @type {Number}
 */
const ENTER_CODE = 13;

/**
 * Признак запуска слушателя новых сообщений
 * @type {Boolean}
 */
let needStartListener = true;

/**
 * Конструктор типа 'Чат'
 */
function Chat() {
  bindAllFunc(this);
  this.voices = audio;
  this.sessionId = _generateSessionId('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx');
  this.timerId = '';
}

/**
 * Отрисовка контейнера чата
 */
Chat.prototype._renderChatContainer = function() {
  this.chatContainer = document.createElement('div');
  this.chatContainer.className = 'chat';
  document.querySelector('body').appendChild(this.chatContainer);
};

/**
 * Отрисовка кнопки раскрытия чата
 */
Chat.prototype.renderChatBtn = function() {
  // Отрисовка контейнера чата, если он еще не отрисован
  if(!document.querySelector('.chat')) {
    this._renderChatContainer();
  }

  // Отрисовка кнопки раскрытия чата
  this.btnChat = document.createElement('button');
  this.btnChat.className = 'btn-chat';
  this.btnChat.innerHTML = BTN_OPEN_TEXT;
  this.chatContainer.appendChild(this.btnChat);
  this.btnChat.setAttribute('type', 'button');
  this.btnChat.addEventListener('click', this._openChat);
};

/**
 * Отрисовка окна чата
 */
Chat.prototype._renderChat = function() {
  this.chat = document.createElement('div');
  this.chat.className = 'chat__wrapper slideInUp';
  this.chatContainer.appendChild(this.chat);

  this.header = document.createElement('div');
  this.header.className = 'chat__header';
  this.header.innerHTML = HEADER_TEXT;
  this.chat.appendChild(this.header);

  this.btnClose = document.createElement('button');
  this.btnClose.className = 'btn-close';
  this.header.appendChild(this.btnClose);
  this.btnClose.setAttribute('type', 'button');
  this.btnClose.addEventListener('click', this._closeChat);

  this.body = document.createElement('div');
  this.body.className = 'chat__body';
  this.chat.appendChild(this.body);

  this.dialog = document.createElement('div');
  this.dialog.className = 'chat__dialog';
  this.body.appendChild(this.dialog);

  this.tip = document.createElement('p');
  this.tip.className = 'chat__tip';
  this.tip.innerText = TIP_TEXT;
  this.dialog.appendChild(this.tip);

  this.chatOpenTime = document.createElement('span');
  this.chatOpenTime.className = 'chat__message-time';
  this.chatOpenTime.innerHTML = _setCurrentTime();
  this.tip.appendChild(this.chatOpenTime);

  this.form = document.createElement('form');
  this.form.className = 'chat__form';
  this.body.appendChild(this.form);
  this.form.setAttribute('action', '');

  this.messageField = document.createElement('div');
  this.messageField.className = 'chat__field';
  this.form.appendChild(this.messageField);

  this.messageInput = document.createElement('textarea');
  this.messageField.appendChild(this.messageInput);
  this.messageInput.setAttribute('placeholder', MESSAGE_INPUT_PLACEHOLDER);
  this.messageInput.setAttribute('name', 'message');
  this.messageInput.setAttribute('maxlength', '200');
  this.messageInput.focus();
  this.messageInput.addEventListener('focus', this._onFieldsFocus);
  this.messageInput.addEventListener('change', this._onFieldsChange);

  this.messageError = document.createElement('p');
  this.messageError.className = 'error-message';
  this.messageField.appendChild(this.messageError);

  this.controls = document.createElement('div');
  this.controls.className = 'chat__controls';
  this.form.appendChild(this.controls);

  this.btnSend = document.createElement('button');
  this.btnSend.className = 'btn-send';
  this.btnSend.innerHTML = 'Отправить';
  this.controls.appendChild(this.btnSend);
  this.btnSend.setAttribute('type', 'button');
  this.btnSend.addEventListener('click', this._onMessageSendClick);

  // Навешивание обработчика события нажатия клавиши 'Enter'
  window.onkeydown = this._onEnterDown;
};

/**
 * [renderMessage description]
 * @param  {String} userType Тип сообщения: user (исх. сообщение) и org (вх. сообщение)
 * @param  {String} text     Текст сообщения
 */
Chat.prototype.renderMessage = function(userType, text) {
  if(this.chat.classList.contains('hidden')) {
    this.chat.classList.remove('hidden');
    this.btnChat.classList.add('hidden');
  }

  // Отрисовка сообщения
  this.chatMessageWrapper = document.createElement('div');
  this.chatMessageWrapper.className = 'chat__message-wrapper';
  this.dialog.appendChild(this.chatMessageWrapper);

  this.message = document.createElement('p');
  this.message.className = 'chat__message';
  this.message.innerHTML = text;
  this.chatMessageWrapper.appendChild(this.message);

  if(userType === 'user') {
    // Отрисовка исх. сообщения
    this.message.classList.add('chat__message--user');
    this.messageInput.value = '';
    this.messageInput.focus();
  } else if(userType === 'org') {
    // Отрисовка вх. сообщения
    this.message.classList.add('chat__message--org');
    this._sound(this.voices.message);
  }

  this.messageTime = document.createElement('span');
  this.messageTime.className = 'chat__message-time';
  this.messageTime.innerHTML = _setCurrentTime();
  this.message.appendChild(this.messageTime);

  // Прокрутка диалога чата к последнему сообщению
  this.dialog.scrollTop = this.dialog.scrollHeight;


  // Запуск слушателя новых вх. сообщений
  if(needStartListener) {
    setLoadTimeout();
    needStartListener = false;
  }
};

/**
 * Отрисовка серверного сообщения об ошибке
 */
Chat.prototype.renderServerError = function() {
  this.serverError = document.createElement('p');
  this.serverError.className = 'error-message server-error';
  this.controls.appendChild(this.serverError);
};

/**
 * Удаление DOM-елемента
 * @param  {Element} parent  Родитель удаляемого элемента
 * @param  {Element} element Удаляемый элемент
 */
Chat.prototype.removeElement = function(parent, element) {
  parent.removeChild(element);
};

/**
 * Раскрытие чата
 */
Chat.prototype._openChat = function() {
  this.btnChat.classList.add('hidden');
  if(this.chat) {
    this.chat.classList.add('slideInUp');
    this.chat.classList.remove('hidden');
    this.messageInput.focus();
  } else {
    this._renderChat();
  }

  // Отмена автоматического открытия чата
  clearTimeout(this.timerId);
};

/**
 * Закрытие чата
 */
Chat.prototype._closeChat = function() {
  let self = this;

  // Скрытие окна чата
  this.chat.classList.remove('slideInUp');
  this.chat.classList.add('slideInDown');

  setTimeout(function() {
    self.chat.classList.add('hidden');
    self.chat.classList.remove('slideInDown');
    self._hideError(self.messageInput);
    self.btnChat.classList.remove('hidden');
  }, CLOSE_CHAT_ANIMATE_DELAY);
};

/**
 * Формирование тела запроса на отправку исх. сообщения
 * @return {Object}
 */
Chat.prototype.sendMessage = function() {
  return {
    'session': this.sessionId,
    'visitor': 'Посетитель ' + _getRandomVisitorNumber(),
    'message': document.querySelector('.chat__form textarea').value
  };
};

/**
 * Формирование тела запроса на получение вх. сообщений
 * @return {Object}
 */
Chat.prototype.getMessage = function() {
  return {
    'session': this.sessionId,
  };
};

/**
 * Воспроизведение звука
 * @param  {String} src Звуковой файл в формате base64
 */
Chat.prototype._sound = function(src) {
  let voice = new Audio();
  voice.src = src;
  voice.autoplay = true;
};

/**
 * Автоматическое открытие чата
 */
Chat.prototype.chatAutoOpen = function() {
  let self = this;
  this.timerId = setTimeout(function() {
    self._openChat();
    self._sound(self.voices.open);
  }, 30000);
};

/**
 * Проверка поля формы на корректность
 * @param  {Element}  element DOM-элемент поля формы
 * @return {Boolean}
 */
Chat.prototype._isFieldValid = function(element) {
  return element.value;
};

/**
 * Отображение текста сообщения об ошибке
 * @param  {Element} element DOM-элемент поля формы, в котором возникла ошибка
 */
Chat.prototype._showError = function(element) {
  element.classList.add('error');
  element.nextElementSibling.innerText = INPUT_IS_REQUIRED_ERROR;
};

/**
 * Скрытие сообщения об ошибке&url=''&site=''
 * @param  {Element} element DOM-элемент поля формы, в котором больше нет ошибки
 */
Chat.prototype._hideError = function(element) {
  element.classList.remove('error');
  element.nextElementSibling.innerText = '';
};

/**
 * Обработчик события изменения содержтимого поля формы
 */
Chat.prototype._onFieldsChange = function() {
  if( this._isFieldValid(this.messageInput) ) {
    this._hideError(this.messageInput);
  } else {
    this._showError(this.messageInput);
  }
};

/**
 * ОБработчик события приобретения полем формы фокуса
 */
Chat.prototype._onFieldsFocus = function() {
  this.messageInput.focus();
  this._hideError(this.messageInput);
};

/**
 * Обработчик события нажатия на кнопку 'Отправить'
 * @param  {Object} event
 */
Chat.prototype._onMessageSendClick = function(event) {
  event.preventDefault();
  if( this._isFieldValid(this.messageInput) ) {
    postMessage();
  } else {
    this._showError(this.messageInput);
  }
};

/**
 * Обработчик события нажатия при заполнении формы клавиши 'Enter'
 * @param  {Object} event
 */
Chat.prototype._onEnterDown = function(event) {
  event = event || window.event;
  if (event.keyCode === ENTER_CODE) {
    this._onMessageSendClick(event);
  }
};

/**
 * Функция-генератор id сессии
 * @param  {String} str Шаблон, по которому будет формироваться id
 * @return {String}     Идентификатор сессии
 */
function _generateSessionId(str) {
  return str.replace(/[xy]/g, function(c) {
    let r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8 )).toString(16);
  });
}

/**
 * Функция-генератор порядкового номера пользователя
 * @return {Number} Порядковый номер пользователя
 */
function _getRandomVisitorNumber() {
  return Math.floor(Math.random() * (500 - 1 + 1)) + 1;
}

/**
 * Установка текущего времени
 * @return {String}
 */

function _setCurrentTime() {
  let currentTime = new Date();
  let currentHours = currentTime.getHours();
  let currentMinutes = currentTime.getMinutes();
  currentHours = currentHours < 10 ? '0' + currentHours : currentHours;
  currentMinutes = currentMinutes < 10 ? '0' + currentMinutes : currentMinutes;
  return currentHours + ':' + currentMinutes;
}
