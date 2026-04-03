import torch
import torch.nn as nn
from torchvision.models import resnet50, ResNet50_Weights
from torchvision import transforms
from PIL import Image

class FeatureExtractor:
    """Extracts intermediate features from a pre-trained ResNet50 model using forward hooks."""
    def __init__(self):
        self.device = torch.device('cpu')
        self.model = resnet50(weights=ResNet50_Weights.DEFAULT).to(self.device)
        self.model.eval()
        
        self.features = []
        def hook(module, input, output):
            self.features.append(output)
            
        self.model.layer2.register_forward_hook(hook)
        self.model.layer3.register_forward_hook(hook)
        
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=ResNet50_Weights.DEFAULT.transforms().mean, 
                                 std=ResNet50_Weights.DEFAULT.transforms().std)
        ])
        
    def extract(self, image: Image.Image):
        """Extract multi-scale features from a PIL Image."""
        self.features = [] # clear previous features
        img_t = self.transform(image).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            self.model(img_t)
            
        # Get layer2 and layer3 outputs
        feat2 = self.features[0] # Shape: (1, 512, 28, 28)
        feat3 = self.features[1] # Shape: (1, 1024, 14, 14)
        
        # Upsample feat3 to match feat2 spatial dimensions
        feat3 = nn.functional.interpolate(feat3, size=feat2.shape[2:], mode='bilinear', align_corners=False)
        
        # Concatenate along channel dimension
        concatenated = torch.cat([feat2, feat3], dim=1) # Shape: (1, 1536, 28, 28)
        return concatenated.squeeze(0).numpy() # Shape: (1536, 28, 28)
