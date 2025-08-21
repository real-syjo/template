'use strict';

//Make navbar transparent when it is on the top
const navbar = document.querySelector('#navbar');
const navbarHeight = navbar.getBoundingClientRect().height;
document.addEventListener('scroll', ()=>{
    if(window.scrollY >navbarHeight){
        navbar.classList.add('navbar--dark');
    }else{
        navbar.classList.remove('navbar--dark');
    }
	navbarMenu.classList.remove('open');
})

//Handle scrolling when tapping on the navbar menu
const navbarMenu = document.querySelector('.navbar__menu');
navbarMenu.addEventListener('click',(event)=>{
    const target = event.target;
	const link = target.dataset.link;
	if(link == null){
		return;
	}
    scrollIntoView(link);
});

//Navbar toggle button for small screen 
const navbarToggleBtn =  document.querySelector('.navbar__toggle-btn');
navbarToggleBtn.addEventListener('click', () => {
	navbarMenu.classList.toggle('open');
});

//contact me 
const homeContackBtn = document.querySelector('.home__contact');
homeContackBtn.addEventListener('click', () => {
	function onClick() {
        document.querySelector('.modal_wrap').style.display ='block';
        document.querySelector('.black_bg').style.display ='block';
    }   
    function offClick() {
        document.querySelector('.modal_wrap').style.display ='none';
        document.querySelector('.black_bg').style.display ='none';
    }
 
    document.getElementById('modal_btn').addEventListener('click', onClick);
    document.querySelector('.modal_close').addEventListener('click', offClick);
})

function scrollIntoView(selector){
	const scrollTo = document.querySelector(selector);
	scrollTo.scrollIntoView({behavior: 'smooth'});
}


// Show "arrow-up" button when scrolling down 
const arrowUp = document.querySelector('.arrow-up');
document.addEventListener('scroll', ()=>{
	if(window.scrollY> navbarHeight / 2){
		arrowUp.classList.add('visible');
	}else{
		arrowUp.classList.remove('visible');
	}
})

// Arrow-up to home
arrowUp.addEventListener('click',()=>{
	scrollIntoView('#home');
})

// Home comment
const elts = {
	text1: document.getElementById("text1"),
	text2: document.getElementById("text2")
};
mode: document.getElementById("mode")

// The strings to morph between. You can change these to anything you want!
const texts = [
	"Hi",
	"I'm SoyeonJO",
	"Developer",
	"Thank you for",
	"visit my website"
];

// Controls the speed of morphing.
const morphTime = 1;
const cooldownTime = 0.25;

let textIndex = texts.length - 1;
let time = new Date();
let morph = 0;
let cooldown = cooldownTime;

elts.text1.textContent = texts[textIndex % texts.length];
elts.text2.textContent = texts[(textIndex + 1) % texts.length];

function doMorph() {
	morph -= cooldown;
	cooldown = 0;
	
	let fraction = morph / morphTime;
	
	if (fraction > 1) {
		cooldown = cooldownTime;
		fraction = 1;
	}
	
	setMorph(fraction);
}

// A lot of the magic happens here, this is what applies the blur filter to the text.
function setMorph(fraction) {
	// fraction = Math.cos(fraction * Math.PI) / -2 + .5;
	
	elts.text2.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
	elts.text2.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;
	
	fraction = 1 - fraction;
	elts.text1.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
	elts.text1.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;
	
	elts.text1.textContent = texts[textIndex % texts.length];
	elts.text2.textContent = texts[(textIndex + 1) % texts.length];
}

function doCooldown() {
	morph = 0;
	
	elts.text2.style.filter = "";
	elts.text2.style.opacity = "100%";
	
	elts.text1.style.filter = "";
	elts.text1.style.opacity = "0%";
}


// #skills 감시
const skillsSection = document.querySelector('#skills');

const io = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view'); // 효과 실행
      obs.unobserve(entry.target);           // 한 번만
    }
  });
}, { threshold: 0.5 });

io.observe(skillsSection);






