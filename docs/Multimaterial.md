

# Multimaterial

### Motivation, goal[](https://community.bistudio.com/wiki/Multimaterial#Motivation,_goal)

MultiMaterial is shader that allows composition of textures used in material from multiple layers of common textures via defined mask. Primary purpose is reducing number of sections, thus on surface which mixes multiple materials is needed only one material to combine them all - rendering pass in just one call. Advantage of using MultiMaterial is similar like with landscape (technology is similar) - saves textures, higher detail, prevents repeating. There is no Fresnel for specularity so it is not that valuable for glossy surfaces. Name of this new shader (vertex as well as pixel) is "Multi".

[![Multishader](./Multimaterial - Bohemia Interactive Community_files/multi.jpg)](https://community.bistudio.com/wiki/File:multi.jpg "Multishader")

### Definition of individual stages in material[](https://community.bistudio.com/wiki/Multimaterial#Definition_of_individual_stages_in_material)

Material uses more than 8 stages (14) and must use alternative write for TexGen definition - with "class TexGenX".  
Details are visible in example. All CO maps may have own TexGen. Mask may have own text gen naturally too.  
Only first 3 SMDI maps may have own TexGen, fourth using TexGen identical with CO4. MC and AS maps using TexGen identical with mask. NO maps are using the TexGen corresponding to their CO Stage.  
"TexGen" refers to the UV Source information, which UVSet to use and their Transform. And is used to calculate the final UV Coordinates to be used to look up the texture.  
But the Shaders only have 8 slots for UV Coordinates, which is not sufficient for MultiMaterial, that's why some Stages re-use other UV Coordinates. The "texGen" number set inside the Stage is actually irrelevant for this.  
Which stage uses which texGen is hard-coded inside the Shader. You may think that you can change the texGen=N assignments from the sample configs below, but it will not have an effect on what the GPU uses at the end.

  

#### 0-3 CO map[](https://community.bistudio.com/wiki/Multimaterial#0-3_CO_map)

Usual CO maps - noteworthy is that it is using also stage 0. On the contrary in model it is awaited that no texture is assigned. While model has also link to texture then it will multiple with stage 0 similarly to macro-map.

#### 4 MASK map[](https://community.bistudio.com/wiki/Multimaterial#4_MASK_map)

Mask determining in RGB components mixing of separate layers.

#### 5-8 DTSMDI map[](https://community.bistudio.com/wiki/Multimaterial#5-8_DTSMDI_map)

Map similar to SMDI map which keeps detail map inside R channel.

#### 9 MC map[](https://community.bistudio.com/wiki/Multimaterial#9_MC_map)

Usual macro map - uses same texture coordinates as mask. Calculations with macro map in this shader is different than usual (so LERP with basic map). With macro map we aim to influence only median/average color in the given place - thus original layers are not overlapped. This technique was taken from mixing with satellite map which is done on terrain.

#### 10 AS map[](https://community.bistudio.com/wiki/Multimaterial#10_AS_map)

Usual ambient map - uses same texture coordinates as mask.

#### 11-14 NO map[](https://community.bistudio.com/wiki/Multimaterial#11-14_NO_map)

Usual NO maps.

### Example[](https://community.bistudio.com/wiki/Multimaterial#Example)

See [Mondkalb's MultiMaterial Tutorial](https://community.bistudio.com/wiki/Mondkalb%27s_MultiMaterial_Tutorial "Mondkalb's MultiMaterial Tutorial") for a detailed walkthrough on how to implement the MultiMaterial.

ambient\[\]\={1,1,1,1.000000};
diffuse\[\]\={1,1,1,1.000000};
forcedDiffuse\[\]\={0.000000,0.000000,0.000000,0.000000};
emmisive\[\]\={0.000000,0.000000,0.000000,1.000000};
specular\[\]\={1.000000,1.0000,1.00000,1.000000};
specularPower\=100.000000;
PixelShaderID\="Multi";
VertexShaderID\="Multi";

class TexGen0
{
	uvSource\="tex";
};
class TexGen1
{
	uvSource\="tex";
};
class TexGen2
{
	uvSource\="tex";
};
class TexGen3
{
	uvSource\="tex";
};
class TexGen4
{
	uvSource\="tex";
};
class TexGen5
{
	uvSource\="tex";
};
class TexGen6
{
	uvSource\="tex";
};
class TexGen7
{
	uvSource\="tex";
};

class Stage0
{
	texture\="ca\\MultiTest\\kostky\_CO.paa";
	texGen\=0;
};
class Stage1
{
	texture\="ca\\MultiTest\\oblaka\_CO.paa";
	texGen\=1;
};
class Stage2
{
	texture\="#(rgba,8,8,3)color(0,0,0,1)";
	texGen\=2;
};
class Stage3
{
	texture\="#(rgba,8,8,3)color(0,0,0,1)";
	texGen\=3;
};
class Stage4
{
	texture\="ca\\MultiTest\\maska\_MASK.paa";
	texGen\=4;
};
class Stage5
{
	texture\="ca\\MultiTest\\kostky\_DTSMDI.paa";
	texGen\=5;
};
class Stage6
{
	texture\="ca\\MultiTest\\oblaka\_DTSMDI.paa";
	texGen\=6;
};
class Stage7
{
	texture\="ca\\MultiTest\\kostky\_DTSMDI.paa";
	texGen\=7;
};
class Stage8
{
	texture\="#(rgba,8,8,3)color(0.5,0,1,1)";
	texGen\=3;
};

class Stage9
{
	texture\="#(rgba,8,8,3)color(1,1,1,0)"; // MC map
	texGen\=4;
};
class Stage10
{
	texture\="#(rgba,8,8,3)color(0,1,1,1)"; // AS map
	texGen\=4;
};
class Stage11
{
	texture\="ca\\MultiTest\\kostky\_NO.paa";
	texGen\=0;
};
class Stage12
{
	texture\="ca\\MultiTest\\oblaka\_NO.paa";
	texGen\=1;
};
class Stage13
{
	texture\="#(rgba,8,8,3)color(0.5,0.5,1,1)";
	texGen\=2;
};
class Stage14
{
	texture\="#(rgba,8,8,3)color(0.5,0.5,1,1)";
	texGen\=3;
};

### Alternate layout[](https://community.bistudio.com/wiki/Multimaterial#Alternate_layout)

ambient\[\]		\= {1,1,1,1};
diffuse\[\]		\= {1,1,1,1};
forcedDiffuse\[\]	\= {0,0,0,0};
emmisive\[\]		\= {0,0,0,1};
specular\[\]		\= {1,1,1,1};
specularPower	\= 50;
PixelShaderID	\= "Multi";
VertexShaderID	\= "Multi";
// BLACK
class TexGen0 	{uvSource\="tex";	class uvTransform{aside\[\]\={1,0,0};	up\[\]\={0,1,0};	dir\[\]\={0,0,1};	pos\[\]\={0,0,0};};};
class TexGen5 	{uvSource\="tex";	class uvTransform{aside\[\]\={1,0,0};	up\[\]\={0,1,0};	dir\[\]\={0,0,1};	pos\[\]\={0,0,0};};};
class Stage0	{texture\="#(argb,8,8,3)color(0,0,0,1,co)";										texGen\="0";};
class Stage5	{texture\="#(argb,8,8,3)color(0.5,0,1,1,DTSMDI)";								texGen\="5";};
class Stage11	{texture\="#(argb,8,8,3)color(0.5,0.5,1,1,NOHQ)";								texGen\="0";};
// RED
class TexGen1 	{uvSource\="tex";	class uvTransform{aside\[\]\={1,0,0};	up\[\]\={0,1,0};	dir\[\]\={0,0,1};	pos\[\]\={0,0,0};};};
class TexGen6 	{uvSource\="tex";	class uvTransform{aside\[\]\={1,0,0};	up\[\]\={0,1,0};	dir\[\]\={0,0,1};	pos\[\]\={0,0,0};};};
class Stage1	{texture\="#(argb,8,8,3)color(1,0,0,1,co)";										texGen\="1";};
class Stage6	{texture\="#(argb,8,8,3)color(0.5,0,1,1,DTSMDI)";								texGen\="6";};
class Stage12	{texture\="#(argb,8,8,3)color(0.5,0.5,1,1,NOHQ)";								texGen\="1";};
// GREEN
class TexGen2 	{uvSource\="tex";	class uvTransform{aside\[\]\={1,0,0};	up\[\]\={0,1,0};	dir\[\]\={0,0,1};	pos\[\]\={0,0,0};};};
class TexGen7 	{uvSource\="tex";	class uvTransform{aside\[\]\={1,0,0};	up\[\]\={0,1,0};	dir\[\]\={0,0,1};	pos\[\]\={0,0,0};};};
class Stage2	{texture\="#(argb,8,8,3)color(0,1,0,1,co)";										texGen\="2";};
class Stage7	{texture\="#(argb,8,8,3)color(0.5,0,1,1,DTSMDI)";								texGen\="7";};
class Stage13	{texture\="#(argb,8,8,3)color(0.5,0.5,1,1,NOHQ)";								texGen\="2";};
// BLUE
class TexGen3 	{uvSource\="tex";	class uvTransform{aside\[\]\={1,0,0};	up\[\]\={0,1,0};	dir\[\]\={0,0,1};	pos\[\]\={0,0,0};};};
class Stage3	{texture\="#(argb,8,8,3)color(0,0,1,1,co)";										texGen\="3";};
class Stage8	{texture\="#(argb,8,8,3)color(0.5,0,1,1,DTSMDI)";								texGen\="3";};
class Stage14	{texture\="#(argb,8,8,3)color(0.5,0.5,1,1,NOHQ)";								texGen\="3";};
// MASK, MC, AS/ADS
class TexGen4 	{uvSource\="tex1";	class uvTransform{aside\[\]\={1,0,0};	up\[\]\={0,1,0};	dir\[\]\={0,0,1};	pos\[\]\={0,0,0};};};
class Stage4	{texture\="#(argb,8,8,3)color(1,0,0,1,Mask)";									texGen\="4";};
class Stage9	{texture\="#(argb,8,8,3)color(0,0,0,0,MC)";										texGen\="4";};
class Stage10	{texture\="#(argb,8,8,3)color(1,1,1,1,ADS)";										texGen\="4";};