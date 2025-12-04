export const getSliderSettings = (itemCount, slidesToShow = 4) => ({
  dots: true,
  infinite: itemCount > slidesToShow,
  speed: 500,
  slidesToShow: Math.min(slidesToShow, itemCount),
  slidesToScroll: Math.min(slidesToShow, itemCount),
  responsive: [
    {
      breakpoint: 1280,
      settings: {
        slidesToShow: Math.min(4, itemCount),
        slidesToScroll: Math.min(4, itemCount),
        infinite: itemCount > 4,
      }
    },
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: Math.min(3, itemCount),
        slidesToScroll: Math.min(3, itemCount),
        infinite: itemCount > 3,
      }
    },
    {
      breakpoint: 600,
      settings: {
        slidesToShow: Math.min(2, itemCount),
        slidesToScroll: Math.min(2, itemCount),
      }
    },
    {
      breakpoint: 480,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1
      }
    }
  ]
}); 