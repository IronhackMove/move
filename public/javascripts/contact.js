$(document).ready(function() {
  var $firstButton = $(".first"),
  $secondButton = $(".second"),
  $thirdButton = $(".third"),
  $input = $("input"),
  $name = $(".name"),
  $more = $(".more"),
  $yourname = $(".yourname"),
  $reset = $(".reset"),
  $ctr = $(".container");

$firstButton.on("click", function(e){
  $(this).text("Saving...").delay(900).queue(function(){
    $ctr.addClass("center slider-two-active").removeClass("full slider-one-active");
  });
  e.preventDefault();
});console.log("hola")

$secondButton.on("click", function(e){
  console.log("HOIla")
  $(this).text("Saving...").delay(900).queue(function(){
    $ctr.addClass("full slider-three-active").removeClass("center slider-two-active slider-one-active");
    $name = $name.val();
    if($name == "") {
      $yourname.html("Anonymous!");
    }
    else { $yourname.html($name+"!"); }
  });
  e.preventDefault();
});

$thirdButton.on("click", function(e){
  $(this).text("Saving...").delay(900).queue(function(){
    $ctr.addClass("full slider-four-active").removeClass("center slider-two-active slider-one-active");
    $(".slider-three")[0].style.display = "none";
    $(".slider-four")[0].style.display = "block";
  });
  e.preventDefault();
});

// copy


})

