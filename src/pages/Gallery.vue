<script setup lang="ts">
import { ref, onMounted } from 'vue'

type ImageItem = {
	id: number
	src: string
	width?: number
	height?: number
}

const images = ref<ImageItem[]>([])
const isPreviewOpen = ref(false)
const previewSrc = ref('')

function openPreview(src: string) {
	previewSrc.value = src
	isPreviewOpen.value = true
}

function closePreview() {
	isPreviewOpen.value = false
	previewSrc.value = ''
}



onMounted(async () => {
	try {
		// Dynamically load image list from JSON file
		const response = await fetch('/images-list.json')
		const imageNames = await response.json() as string[]
		
		// Create image URLs pointing to public directory
		const imageUrls = imageNames.map(name => `/images/${name}`)
		images.value = imageUrls.map((src, idx) => ({ id: idx + 1, src }))
		
		// Measure intrinsic sizes for better preview fitting
		for (const item of images.value) {
			const img = new Image()
			img.decoding = 'async'
			img.src = item.src
			img.onload = () => {
				item.width = img.naturalWidth
				item.height = img.naturalHeight
			}
			img.onerror = () => {
				console.warn(`Failed to load image: ${item.src}`)
			}
		}
		
		console.log('Loaded images:', images.value.length)
	} catch (error) {
		console.error('Failed to load image list:', error)
		
		// Fallback: use a subset of known images
		const fallbackImages = [
			'/images/xibao.jpg',
			'/images/IMG_5265.jpg',
			'/images/IMG_5264.jpg'
		]
		images.value = fallbackImages.map((src, idx) => ({ id: idx + 1, src }))
		console.log('Using fallback images:', images.value.length)
	}
})
</script>

<template>
	<div class="gallery">		
		<div class="masonry" aria-label="image-masonry">
			<button
				v-for="img in images"
				:key="img.id"
				class="masonry-item"
				@click="openPreview(img.src)"
				aria-label="preview image"
			>
				<img 
					:src="img.src" 
					:alt="`图片 ${img.id}`" 
					loading="lazy" 
					decoding="async"
				/>
			</button>
		</div>

		<!-- Preview Overlay -->
		<div v-if="isPreviewOpen" class="overlay" @click.self="closePreview">
			<img class="overlay-img" :src="previewSrc" alt="preview large" />
			<button class="close" @click="closePreview" aria-label="close preview">✕</button>
		</div>
	</div>
</template>

<style scoped>
.gallery {
	padding: 12px;
}



/* Responsive grid layout for masonry effect */
.masonry {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
	gap: 12px;
}

@media (max-width: 768px) {
	.masonry {
		grid-template-columns: repeat(2, 1fr);
	}
}

@media (max-width: 480px) {
	.masonry {
		grid-template-columns: 1fr;
	}
}

.masonry-item {
	display: block;
	width: 100%;
	border: 0;
	padding: 0;
	background: transparent;
	cursor: zoom-in;
	border-radius: 10px;
	overflow: hidden;
	box-shadow: 0 1px 4px rgba(0,0,0,.08);
	transition: transform 0.2s ease;
}

.masonry-item:hover {
	transform: scale(1.02);
}

.masonry-item img {
	display: block;
	width: 100%;
	height: auto;
	object-fit: cover;
	transition: transform .2s ease;
}

.masonry-item:active img,
.masonry-item:focus-visible img {
	transform: scale(1.02);
}

/* Fullscreen preview */
.overlay {
	position: fixed;
	inset: 0;
	background: rgba(0,0,0,.82);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
}

.overlay-img {
	max-width: 100vw;
	max-height: 100vh;
	width: 100%;
	height: auto;
	object-fit: contain;
	cursor: zoom-out;
}

.close {
	position: fixed;
	top: 12px;
	right: 12px;
	border: none;
	background: rgba(255,255,255,.15);
	color: #fff;
	font-size: 20px;
	line-height: 1;
	padding: 8px 10px;
	border-radius: 8px;
	cursor: pointer;
}

.close:active,
.close:focus-visible {
	background: rgba(255,255,255,.25);
}
</style>


