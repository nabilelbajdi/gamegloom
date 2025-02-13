export const getSliderSettings = (itemCount) => ({
  dots: true,
  infinite: itemCount > 4,
  speed: 500,
  slidesToShow: Math.min(4, itemCount),
  slidesToScroll: Math.min(4, itemCount),
  responsive: [
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