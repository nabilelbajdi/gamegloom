import eldenRingCover from "../assets/images/game-covers/elden-ring.jpg";
import witcher3Cover from "../assets/images/game-covers/witcher3.jpg";
import baldurGateCover from "../assets/images/game-covers/baldurs-gate-3.png";
import poe2Cover from "../assets/images/game-covers/poe2.jpg";
import userAvatar from "../assets/images/avatars/raven.jpeg";
import userAvatar2 from "../assets/images/avatars/tyrande.png";
import userAvatar3 from "../assets/images/avatars/diablo-avatar.jpg";
import userAvatar4 from "../assets/images/avatars/winton.png";

const reviewedGames = [
  {
    gameTitle: "Elden Ring",
    platform: "PS5",
    reviewText:
      "Elden Ring is a breathtaking experience. The open world is vast and filled with secrets, and the combat is both challenging and rewarding. The lore is deep, and I found myself lost in the story for hours. It's a game that truly defines the RPG genre. From the moment you step into the world, you're greeted with stunning visuals and a hauntingly beautiful soundtrack that sets the tone for your adventure. The character customization is extensive, allowing you to tailor your playstyle to your liking. As you explore, you'll encounter a variety of enemies, each requiring different strategies to defeat. The boss battles are particularly memorable, offering a level of challenge that is both frustrating and exhilarating. The narrative is woven seamlessly into the gameplay, with every location and character adding depth to the story. Elden Ring is not just a game; it's an experience that stays with you long after you've put down the controller. Whether you're a fan of RPGs or new to the genre, this is a title that should not be missed. The attention to detail is unparalleled, and the world feels alive with possibilities. It's a testament to the developers' passion and dedication, and it sets a new standard for what an open-world RPG can be.",
    user: "Raven",
    date: "2025-02-20",
    likes: 12,
    dislikes: 3,
    comments: 3,
    rating: 4,
    coverImage: eldenRingCover,
    userAvatar: userAvatar,
    userFollowers: 1423,
    userReviews: 123,
  },
  {
    gameTitle: "The Witcher 3",
    platform: "XBOX",
    reviewText:
      "The Witcher 3 remains one of the most immersive RPGs I've ever played. The world is stunningly detailed, and the characters are incredibly well-written. The quests are engaging, and the choices you make have real consequences. It's a game that every RPG fan should experience at least once.",
    user: "Tyrande",
    date: "2025-02-22",
    likes: 20,
    dislikes: 5,
    comments: 11,
    rating: 4,
    coverImage: witcher3Cover,
    userAvatar: userAvatar2,
    userFollowers: 253,
    userReviews: 82,
  },
  {
    gameTitle: "Baldur's Gate 3",
    platform: "PC",
    reviewText:
      "Baldur's Gate 3 is a masterpiece of storytelling and character development. The tactical combat is deep and satisfying, and the choices you make truly matter. The game is a love letter to fans of classic RPGs, and it's a journey that I will remember for a long time.",
    user: "El Diablo",
    date: "2025-02-10",
    likes: 10,
    dislikes: 2,
    comments: 7,
    rating: 5,
    coverImage: baldurGateCover,
    userAvatar: userAvatar3,
    userFollowers: 547,
    userReviews: 23,
  },
  {
    gameTitle: "Path of Exile 2",
    platform: "PC",
    reviewText:
      "Path of Exile 2 builds upon the foundation of its predecessor with new classes and combat mechanics that add a refreshing depth to the gameplay. The graphics have been significantly improved, and the new story elements are intriguing. It's a must-play for any ARPG fan looking for a challenge.",
    user: "winton",
    date: "2025-02-15",
    likes: 15,
    dislikes: 3,
    comments: 7,
    rating: 3,
    coverImage: poe2Cover,
    userAvatar: userAvatar4,
    userFollowers: 73522,
    userReviews: 421,
  },
];

export default reviewedGames;
