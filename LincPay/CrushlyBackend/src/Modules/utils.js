

module.exports = {
  passwordGenerator: function () {
    const colors = ["red", "blue", "green", "yellow", "purple", "orange", "pink"];
    const nouns = ["river", "mountain", "pillow", "rocket", "dream", "forest", "cloud"];
    const verbs = ["run", "jump", "fly", "drift", "land", "float", "shine"];
    const specialChars = ["!", "@", "#", "$", "%", "&", "*"];

    const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);
    const number = Math.floor(10 + Math.random() * 90); // Two-digit number (10-99)

    const word1 = Math.abs(number % 2) == 1 ? capitalize(randomItem(colors)) : randomItem(colors);
    const word2 = Math.abs(number % 2) == 2 ? capitalize(randomItem(verbs)) : randomItem(verbs);
    const word3 = Math.abs(number % 2) == 1 ? capitalize(randomItem(nouns)) : randomItem(nouns);
    const word4 = randomItem(specialChars);
    const word5 = number;

    function shuffle(array) {
      let currentIndex = array.length;
      while (currentIndex != 0) {
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
          array[randomIndex], array[currentIndex]];
      }

      return array;
    }
    const words = [word1, word2, word3, word4, word5];
    const shuffledWords = shuffle(words);
    const password = `${shuffledWords.join("")}`;
    return password;
  }
};
