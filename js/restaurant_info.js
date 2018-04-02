
navigator.serviceWorker.register('sw.js');
const VERSION = 0.1;
const CACHE_NAME = 'RESTAURANT_REVIEWS';

let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
      return;
    }

    const mapEl = document.getElementById('map');

    // couldn't fetch the js
    if (typeof google === 'undefined') {
      // return caches.open(`${CACHE_NAME}_${VERSION}`).then(function (cache) {
      //   return cache.match(`/restaurant_${restaurant.id}_staticmap`).then(function (matching) {
      //     if (!matching) return;

      //     const img = document.createElement('img');
      //     img.src = `/restaurant_${restaurant.id}_staticmap`;
      //     img.alt = `${restaurant.name} - StaticMap`;

      //     mapEl.appendChild(img);
      //   });
      // });
    } else {
      self.map = new google.maps.Map(mapEl, {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }

    fillBreadcrumb();

    // TODO: Maybe fetch a static map image and cache it for offline usage.
  //   if (!navigator.serviceWorker.controller) {
  //     return;
  //   }
  //   navigator.serviceWorker.controller.postMessage({
  //     action: 'staticmap',
  //     restaurant
  //   });
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = `${restaurant.name} Restaurant in ${restaurant.neighborhood}`;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.querySelector('.restaurant__reviews');
  const title = document.createElement('h3');
  title.className = "restaurant__reviews__title";
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.querySelector('.reviews__list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.className = 'review__item';

  const header = document.createElement('div');
  header.className = 'review__item__header';

  const name = document.createElement('h3');
  name.innerHTML = review.name;
  header.appendChild(name);

  const date = document.createElement('span');
  date.innerHTML = review.date;
  date.className = "review__item__timestamp";
  header.appendChild(date);

  li.appendChild(header);

  const body = document.createElement('div');
  body.className = 'review__item__body';

  const rating = document.createElement('span');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.className = 'review__item__rating';
  body.appendChild(rating);

  const comments = document.createElement('p');
  comments.className = 'review__item__comments';
  comments.innerHTML = review.comments;
  body.appendChild(comments);

  li.appendChild(body);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = window.location.href;
  a.setAttribute('aria-current', 'page');
  a.className = 'is-active';
  a.innerHTML = restaurant.name;
  li.appendChild(a);
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
