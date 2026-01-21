
# Super shader


### Motivation, goal[](https://community.bistudio.com/wiki/Super_shader#Motivation,_goal)

Super shader is a shader, which contains all standard shader techniques, such as normal, specular, ambient, detail maps and so on. Furthermore it has on input fresnel map defining course of specularity similarly to shader Glass. The goal is it to use this shader for all default in-game objects. For such objects which have not defined some maps may be used default, procedurally generated textures.

### Definition of individual stages in material[](https://community.bistudio.com/wiki/Super_shader#Definition_of_individual_stages_in_material)

In frames are quoted default values in case we want that stage ignored.

#### 1\. Normal map[](https://community.bistudio.com/wiki/Super_shader#1._Normal_map)

Normal map of type \_NO or \_NOHQ. Normal mapping is a technique used to fake the lighting of surface bumps and dents. It is used to enhance the appearance of low polygon models. The R,G,B values for each pixel in the map correspond to the X,Y,Z angle of a surface normal at that pixel.

texture\="#(argb,8,8,3)color(0.5,0.5,1,1)";

#### 2\. Detail map[](https://community.bistudio.com/wiki/Super_shader#2._Detail_map)

Detail map of type \_DT.

Detail maps add to diffusion map inside one stage another repeating texture to reach greater fineness for close view onto big surfaces which would too complicated to cover with oversized texture resolution.

⚠

DetailTexture (\_DT) has painting saved inside alpha-channel (RGB components are ignored while this texture is converted from TGA to PAA). Because shader in a way multiplying detail texture with colored diffusion component, it is necessary that average color of detail texture should be 50% grey. Otherwise if material with detail texture is cutoff inside lower LOD then it may result into visible change of texture brightness (MipMapping is applied with distance and angle).

texture\="#(argb,8,8,3)color(0.5,0.5,0.5,0)";

#### 3\. Macro map[](https://community.bistudio.com/wiki/Super_shader#3._Macro_map)

Macro map \_MC.

Macro texture contains alternative data to basic texture. Representation of basic texture and macro texture for given place is selected by macrotexture alpha channel (1 means only macro texture , 0 means only basic texture). RGB is calculated as LERP with basic map. Detail map is applied on the end (last) thus overlay original and macro map.

texture\="#(argb,8,8,3)color(0,0,0,0)";

#### 4\. AmbientShadow map[](https://community.bistudio.com/wiki/Super_shader#4._AmbientShadow_map)

Ambient shadow map \_AS.

Ambient shadow texture contains stored information "how much ambient light is in given place'. White color means full ambient lighting. 0 means none.In fact only channel which is taken advantage of is G - it is thus important that information is correctly in him. Rest of channels doesn't matter and anything can be placed there (may be same as in G).

texture\="#(argb,8,8,3)color(0,1,1,1)";

#### 5\. Specular map[](https://community.bistudio.com/wiki/Super_shader#5._Specular_map)

Specular map of \_SMDI type (\_SM isn't supported). \_SMDI maps are bit depth optimized specular maps. Each channel in the 24 bit (RGB) SMDI map has a different function. The R channel should be set to 1 for all pixels, the G channel functions as a specular map, and the B channel functions as a specular power map (also known as gloss map, where black means very rough \[matte\] surface and white means very smooth \[shiny\] surface).

#### 6\. Fresnel function[](https://community.bistudio.com/wiki/Super_shader#6._Fresnel_function)

Fresnel function is entered as procedural texture in following form:

texture\="#(ai,64,64,1)fresnel(N,K)";

N and K (where N is refractive index and K - absorption coefficient) are inputs for fresnel equation that's on theirs basics and for given angle, able determine how much reflects under given angle. N and K are constant for given material and are known for individual elements. The following table includes a list of basic materials and their settings. The table also shows the wavelengths. Visible spectrum is approx 400 nm-800 nm.

Values close to the middle of this spectrum are interesting.

| Material | wavelength | N | K |
| --- | --- | --- | --- |
| Aluminum | 600 | 1.3 | 7 |
| Cobalt | 600 | 0.2 | 3 |
| Copper | 850 | 2.08 | 7.15 |
| Gold | 600 | 0.3 | 3 |
| Iron | 886 | 3.12 | 3.87 |
| Lead | 850 | 1.44 | 4.35 |
| Molybdenum | 954 | 2.77 | 3.74 |
| Nickel | 855 | 2.59 | 4.55 |
| Palladium | 827 | 2.17 | 5.22 |
| Platinum | 827 | 2.92 | 5.07 |
| Silver | 600 | 0.2 | 3 |
| Titanium | 821 | 3.21 | 4.01 |
| Vanadium | 984 | 2.94 | 3.50 |
| Tungsten | 827 | 3.48 | 2.79 |

Additional source for N and K values:

*   [http://en.wikipedia.org/wiki/List\_of\_refractive\_indices](http://en.wikipedia.org/wiki/List_of_refractive_indices)

Other values must must be found empirically. The following program can be used in TexView and can help you to find additional values. It visualizes the course of the fresnel function for given N and K values. (on left is normal line to line of sight, on right directly against line of sight, the more is value closer 1 the higher reflection is):

`N = 0.969770; K = 0.0118000; X = u * 0.5 + 0.5; S = acos(X); AA = sqrt((sqrt((N^2-K^2-sin(S)^2)^2 + 4*N^2*K^2)+(N^2-K^2-sin(S)^2))/2); BB = sqrt((sqrt((N^2-K^2-sin(S)^2)^2 + 4*N^2*K^2)-(N^2-K^2-sin(S)^2))/2); FS = (AA^2+BB^2-2*AA*cos(S) + cos(S)^2)/(AA^2+BB^2+2*AA*cos(S) + cos(S)^2); FP = FS*(AA^2+BB^2-2*AA*sin(S)*tan(S)+sin(S)^2*tan(S)^2)/(AA^2+BB^2+2*AA*sin(S)*tan(S)+sin(S)^2*tan(S)^2); r=1; g=1; b=1; a=(FS+FP)/2;`

#### 7\. Environmental map[](https://community.bistudio.com/wiki/Super_shader#7._Environmental_map)

This technology allows to show environmental reflections on materials. The reflected environment is static and only changes its lighting accordingly to time of day. Environment is characterized by the texture which is called environmental map. In our case environmental map presents hemisphere projection into plane.

### Example[](https://community.bistudio.com/wiki/Super_shader#Example)

ambient\[\]\={1,1,1,1};
diffuse\[\]\={1,1,1,1};
forcedDiffuse\[\]\={0,0,0,0};
emmisive\[\]\={0,0,0,1};
specular\[\]\={0.7,0.7,0.7,1};
specularPower\=180;
PixelShaderID\="Super";
VertexShaderID\="Super";
class Stage1
{
texture\="ca\\weapons\\data\\aimpoint\_NOHQ.paa";
uvSource\="tex";
};
class Stage2
{
texture\="#(argb,8,8,3)color(0.5,0.5,0.5,0)";
uvSource\="tex";
};
class Stage3
{
      texture\="#(argb,8,8,3)color(0,0,0,0)";
uvSource\="tex";
};
class Stage4
{
texture\="#(argb,8,8,3)color(0,1,1,1)";
uvSource\="tex";
};
class Stage5
{
texture\="ca\\weapons\\data\\aimpoint\_SMDI.paa";
uvSource\="tex";
};
class Stage6
{
texture\="#(ai,64,64,1)fresnel(1.3,7)";
uvSource\="none";
};
class Stage7
{
texture\="ca\\air\\data\\env\_co.paa";
uvSource\="none";
};

## Default Values[](https://community.bistudio.com/wiki/Super_shader#Default_Values)

ambient\[\] \= {1,1,1,1};
diffuse\[\] \= {1,1,1,1};
forcedDiffuse\[\] \= {0,0,0,1};
emmisive\[\] \= {0,0,0,0};
specular\[\] \= {1,1,1,1};
specularPower \= 30;
PixelShaderID \= "Super";
VertexShaderID \= "Super";
class Stage1
{
  texture \= "#(argb,8,8,3)color(0.5,0.5,1,1,NOHQ)";
  uvSource \= "tex";
  class uvTransform
  {
    aside\[\] \= {1,0,0};
    up\[\] \= {0,1,0};
    dir\[\] \= {0,0,1};
    pos\[\] \= {0,0,0};
  };
};
class Stage2
{
  texture \= "#(argb,8,8,3)color(0.5,0.5,0.5,0.5,DT)";
  uvSource \= "tex";
  class uvTransform
  {
    aside\[\] \= {1,0,0};
    up\[\] \= {0,1,0};
    dir\[\] \= {0,0,1};
    pos\[\] \= {0,0,0};
  };
};
class Stage3
{
  texture \= "#(argb,8,8,3)color(0,0,0,0,MC)";
  uvSource \= "tex";
  class uvTransform
  {
    aside\[\] \= {1,0,0};
    up\[\] \= {0,1,0};
    dir\[\] \= {0,0,1};
    pos\[\] \= {0,0,0};
  };
};
class Stage4
{
  texture \= "#(argb,8,8,3)color(1,1,1,1,AS)";
  uvSource \= "tex";
  class uvTransform
  {
    aside\[\] \= {1,0,0};
    up\[\] \= {0,1,0};
    dir\[\] \= {0,0,1};
    pos\[\] \= {0,0,0};
  };
};
class Stage5
{
  texture \= "#(argb,8,8,3)color(1,0,1,0,SMDI)";
  uvSource \= "tex";
  class uvTransform
  {
    aside\[\] \= {1,0,0};
    up\[\] \= {0,1,0};
    dir\[\] \= {0,0,1};
    pos\[\] \= {0,0,0};
  };
};
class Stage6
{
  texture \= "#(ai,64,64,1)fresnel(0.4,0.2)";
  uvSource \= "tex";
  class uvTransform
  {
    aside\[\] \= {1,0,0};
    up\[\] \= {0,1,0};
    dir\[\] \= {0,0,1};
    pos\[\] \= {0,0,0};
  };
};
class Stage7
{
  texture \= "a3\\data\_f\\env\_land\_co.paa";
  useWorldEnvMap \= "true";
  uvSource \= "tex";
  class uvTransform
  {
    aside\[\] \= {1,0,0};
    up\[\] \= {0,1,0};
    dir\[\] \= {0,0,1};
    pos\[\] \= {0,0,0};
  };
};
class StageTI
{
  texture \= "a3\\data\_f\\default\_vehicle\_ti\_ca.paa";
};

### How is gained fresnel from procedural texture[](https://community.bistudio.com/wiki/Super_shader#How_is_gained_fresnel_from_procedural_texture)

Procedural texture for fresnel function contains single-dimensional conversion table (visually it is sort of brightness gradient ) from which reads value on position (U,V). Value U is calculated as scalar product between normal line and direction to the camera (both vertors must be normalized)) in each surface point of model (this value also represents cosine of angle between vectors). Value V is always 0.5, therefore it is unneeded that texture height would be different than 1. For example: function with parameters N = 1.0 and K = 0.6 should be entered with width 64 and height 1: "#(ai,64,1,1)fresnel(1,0.6)". Size of texture is then only 64 bytes instead 4096 in case if the height is 64. When we realize that such texture is generated for every material with fresnel inside scene, then saving of memory and performance is indispensable!
